<template>
  <div class="sidebar-sync">
    <!-- Konfiguration -->
    <div class="sidebar-section">
      <div class="sidebar-header sidebar-header--static">
        <span class="sidebar-title">Kooperativer Sync</span>
        <div class="sync-badge" :class="badgeClass">
          <span class="sync-badge-dot" />
          {{ badgeLabel }}
        </div>
      </div>

      <div class="sidebar-section-body">
        <p class="sidebar-description">Synchronisiert das Modell über eine REST- oder WebSocket-API mit anderen Teilnehmern derselben Session.</p>

        <v-text-field v-model="apiUrl" label="API-Basis-URL" placeholder="https://api.example.com" density="compact" variant="outlined" hide-details="auto" :disabled="isConnected" />

        <div class="session-row">
          <v-text-field v-model="sessionId" label="Session-ID" placeholder="raum-1" density="compact" variant="outlined" hide-details="auto" :disabled="isConnected" style="flex: 1" />
          <v-btn icon="mdi-refresh" variant="text" size="small" :disabled="isConnected" title="Neue zufällige Session-ID generieren" @click="generateSessionId" />
        </div>

        <div>
          <p class="sidebar-hint config-label">Verbindungsmodus</p>
          <v-btn-toggle v-model="mode" mandatory density="compact" color="primary" class="mode-toggle" :disabled="isConnected">
            <v-btn value="polling" size="small">Polling</v-btn>
            <v-btn value="websocket" size="small">WebSocket</v-btn>
          </v-btn-toggle>
        </div>

        <div v-if="mode === 'polling'" class="poll-row">
          <p class="sidebar-hint">Intervall: {{ pollIntervalMs }} ms</p>
          <v-slider v-model="pollIntervalMs" :min="500" :max="10000" :step="500" density="compact" hide-details :disabled="isConnected" />
        </div>

        <div>
          <p class="sidebar-hint config-label">Konflikt-Strategie</p>
          <v-btn-toggle v-model="conflictStrategy" mandatory density="compact" color="primary" :disabled="isConnected">
            <v-btn value="remote-wins" size="small">Remote</v-btn>
            <v-btn value="local-wins" size="small">Lokal</v-btn>
          </v-btn-toggle>
        </div>

        <p v-if="errorMessage" class="sidebar-error">{{ errorMessage }}</p>

        <v-btn :color="isConnected ? 'error' : 'primary'" variant="flat" size="small" :prepend-icon="isConnected ? 'mdi-lan-disconnect' : 'mdi-lan-connect'" @click="toggleConnection">
          {{ isConnected ? 'Trennen' : 'Verbinden' }}
        </v-btn>
      </div>
    </div>

    <!-- Manuelle Aktionen (nur wenn verbunden) -->
    <div v-if="isConnected" class="sidebar-section">
      <div class="sidebar-header sidebar-header--static">
        <span class="sidebar-title">Manuell</span>
        <div v-if="syncStatus.pendingPush" class="pending-indicator" title="Ausstehende Änderungen">
          <v-icon size="10" color="warning">mdi-circle</v-icon>
          <span class="sidebar-hint">ausstehend</span>
        </div>
      </div>

      <div class="sidebar-section-body">
        <div class="sidebar-action-buttons">
          <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-upload" @click="handlePushNow"> Push </v-btn>
          <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-download" @click="handlePullNow"> Pull </v-btn>
        </div>

        <div class="timestamps">
          <span v-if="syncStatus.lastPushedAt" class="sidebar-hint"> ↑ {{ formatTime(syncStatus.lastPushedAt) }} </span>
          <span v-if="syncStatus.lastPulledAt" class="sidebar-hint"> ↓ {{ formatTime(syncStatus.lastPulledAt) }} </span>
        </div>
      </div>
    </div>

    <!-- Aktivitätslog -->
    <div class="sidebar-section sidebar-section--grow">
      <div class="sidebar-header sidebar-header--static">
        <span class="sidebar-title">Aktivitätslog</span>
        <v-btn v-if="log.length" icon="mdi-delete-sweep-outline" variant="text" size="x-small" title="Log leeren" @click="log = []" />
      </div>

      <div class="sync-log">
        <div v-if="!log.length" class="sync-log-empty">
          <span class="sidebar-hint">Noch keine Aktivität …</span>
        </div>
        <div v-for="entry in log" :key="entry.id" class="log-entry" :class="`log-entry--${entry.type}`">
          <span class="log-time">{{ entry.time }}</span>
          <v-icon size="11">{{ entry.icon }}</v-icon>
          <span class="log-text">{{ entry.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// ---------------------------------------------------------------------------
// Lokale Typen
// (Entsprechen den Typen aus @/utils/modelSync — hier ohne direkte Abhängigkeit)
// ---------------------------------------------------------------------------

type SyncMode = 'polling' | 'websocket'
type ConflictStrategy = 'remote-wins' | 'local-wins'

interface SyncStatus {
  connected: boolean
  lastPushedAt: number | null
  lastPulledAt: number | null
  pendingPush: boolean
}

// ---------------------------------------------------------------------------
// Konfigurations-State
// ---------------------------------------------------------------------------

const apiUrl = ref('http://localhost:3000')
const sessionId = ref(generateShortId())
const mode = ref<SyncMode>('polling')
const pollIntervalMs = ref(2000)
const conflictStrategy = ref<ConflictStrategy>('remote-wins')

function generateShortId(): string {
  return Math.random().toString(36).slice(2, 8)
}

const generateSessionId = () => {
  sessionId.value = generateShortId()
}

// ---------------------------------------------------------------------------
// Verbindungs-State
// ---------------------------------------------------------------------------

const isConnected = ref(false)
const errorMessage = ref('')

const syncStatus = ref<SyncStatus>({
  connected: false,
  lastPushedAt: null,
  lastPulledAt: null,
  pendingPush: false
})

// ---------------------------------------------------------------------------
// Aktivitätslog
// ---------------------------------------------------------------------------

interface LogEntry {
  id: number
  time: string
  text: string
  type: 'info' | 'push' | 'pull' | 'error'
  icon: string
}

const LOG_ICONS: Record<LogEntry['type'], string> = {
  info: 'mdi-information-outline',
  push: 'mdi-upload-outline',
  pull: 'mdi-download-outline',
  error: 'mdi-alert-outline'
}

let logCounter = 0
const log = ref<LogEntry[]>([])
const MAX_LOG = 50

function addLog(text: string, type: LogEntry['type']) {
  log.value.unshift({
    id: logCounter++,
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text,
    type,
    icon: LOG_ICONS[type]
  })
  if (log.value.length > MAX_LOG) log.value = log.value.slice(0, MAX_LOG)
}

// ---------------------------------------------------------------------------
// Connect / Disconnect
//
// TODO: Hier deinen eigenen Sync-Service initialisieren und an den Graph binden.
//
// Empfohlene Ansätze:
//   • ModelSyncClient aus @/utils/modelSync (REST-Polling oder WebSocket)
//   • Supabase Realtime / Firebase RTDB
//   • Eigener WebSocket-Server mit Y.js / Automerge für CRDT-basierte Sync
//   • Liveblocks, PartyKit oder ähnliche Collaboration-Plattformen
//
// Die Konfigurationswerte stehen in:
//   apiUrl.value, sessionId.value, mode.value,
//   pollIntervalMs.value, conflictStrategy.value
//
// Der Graph ist über `useGraphContext()` aus @/composables/useGraphContext erreichbar.
// Das aktuelle Modell-XML erhältst du mit exportModelAsXml(graph) aus @/utils/modelPersistence.
// Zum Anwenden eines empfangenen XML nutze importModelFromXml(graph, xml).
// ---------------------------------------------------------------------------

const toggleConnection = () => {
  if (isConnected.value) {
    disconnect()
  } else {
    connect()
  }
}

const connect = () => {
  if (!apiUrl.value.trim()) {
    errorMessage.value = 'Bitte eine API-URL angeben.'
    return
  }
  if (!sessionId.value.trim()) {
    errorMessage.value = 'Bitte eine Session-ID angeben.'
    return
  }

  errorMessage.value = ''

  // TODO: Service instanziieren und starten
  //
  // Beispiel mit ModelSyncClient:
  //   const { graph } = useGraphContext()
  //   client = new ModelSyncClient({ baseUrl: apiUrl.value, sessionId: sessionId.value, ... })
  //   client.attach(graph.value)
  //
  // Nach erfolgreichem Verbinden:
  //   syncStatus.value = { connected: true, ... }
  //   addLog('...', 'info')

  isConnected.value = true
  syncStatus.value = { ...syncStatus.value, connected: true }
  addLog(`Verbunden mit Session „${sessionId.value}" (${mode.value}) — Stub, noch kein Service angebunden`, 'info')
}

const disconnect = () => {
  // TODO: Service stoppen / trennen
  //   client?.detach()
  //   client = null

  isConnected.value = false
  syncStatus.value = { connected: false, lastPushedAt: null, lastPulledAt: null, pendingPush: false }
  addLog('Verbindung getrennt', 'info')
}

// ---------------------------------------------------------------------------
// Manuelle Aktionen
//
// TODO: pushNow / pullNow des eigenen Service aufrufen und
//       syncStatus sowie Log entsprechend aktualisieren.
// ---------------------------------------------------------------------------

const handlePushNow = async () => {
  // TODO: await client?.pushNow()
  addLog('Push ausgelöst — Stub, noch kein Service angebunden', 'push')
  syncStatus.value = { ...syncStatus.value, lastPushedAt: Date.now(), pendingPush: false }
}

const handlePullNow = async () => {
  // TODO: await client?.pullNow()
  addLog('Pull ausgelöst — Stub, noch kein Service angebunden', 'pull')
  syncStatus.value = { ...syncStatus.value, lastPulledAt: Date.now() }
}

// ---------------------------------------------------------------------------
// UI-Hilfsfunktionen
// ---------------------------------------------------------------------------

const badgeClass = computed(() => ({
  'sync-badge--connected': isConnected.value && syncStatus.value.connected,
  'sync-badge--pending': isConnected.value && syncStatus.value.pendingPush,
  'sync-badge--disconnected': !isConnected.value
}))

const badgeLabel = computed(() => {
  if (!isConnected.value) return 'getrennt'
  if (syncStatus.value.pendingPush) return 'ausstehend'
  return 'verbunden'
})

const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
</script>

<style scoped>
.sidebar-sync {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  background: #ffffff;
}

.sidebar-sync::-webkit-scrollbar {
  width: 6px;
}

.sidebar-sync::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-sync::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 4px;
}

.sidebar-sync::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.35);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex-shrink: 0;
}

.sidebar-section--grow {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 10px 9px 12px;
  border-left: 3px solid rgba(var(--v-theme-on-surface), 0.25);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
  gap: 6px;
  flex-shrink: 0;
}

.sidebar-header--static {
  cursor: default;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.sidebar-section-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.sidebar-description {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.sidebar-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.sidebar-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  font-size: 12px;
}

.sidebar-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Status-Badge */
.sync-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  transition:
    background 0.2s,
    color 0.2s;
}

.sync-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sync-badge--connected {
  background: rgba(var(--v-theme-success, 76, 175, 80), 0.12);
  color: rgb(46, 125, 50);
}
.sync-badge--connected .sync-badge-dot {
  background: rgb(56, 142, 60);
}

.sync-badge--pending {
  background: rgba(var(--v-theme-warning, 255, 152, 0), 0.15);
  color: rgb(230, 81, 0);
}
.sync-badge--pending .sync-badge-dot {
  background: rgb(239, 108, 0);
  animation: pulse 1s ease-in-out infinite;
}

.sync-badge--disconnected {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.sync-badge--disconnected .sync-badge-dot {
  background: rgba(var(--v-theme-on-surface), 0.28);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* Konfiguration */
.session-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-label {
  margin-bottom: 5px !important;
}

.mode-toggle {
  width: fit-content;
}

.poll-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Ausstehend-Indikator */
.pending-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
}

/* Timestamps */
.timestamps {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Aktivitätslog */
.sync-log {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 0;
}

.sync-log-empty {
  padding: 12px 12px;
}

.log-entry {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 3px 12px;
  font-size: 11px;
  line-height: 1.4;
  border-left: 2px solid transparent;
  transition: background 0.1s;
}

.log-entry:hover {
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.log-entry--push {
  border-left-color: rgba(var(--v-theme-primary), 0.5);
}

.log-entry--pull {
  border-left-color: rgba(var(--v-theme-secondary), 0.5);
}

.log-entry--error {
  border-left-color: rgba(var(--v-theme-error), 0.6);
  background: rgba(var(--v-theme-error), 0.04);
}

.log-entry--info {
  border-left-color: rgba(var(--v-theme-on-surface), 0.15);
}

.log-time {
  flex-shrink: 0;
  color: rgba(var(--v-theme-on-surface), 0.38);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.log-text {
  color: rgba(var(--v-theme-on-surface), 0.72);
  word-break: break-all;
}
</style>

/**
 * Layanan kontrol simulasi jaringan & error API.
 * Berguna untuk mendemokan/menguji secara langsung:
 * 1. Mode Offline (perangkat terputus dari internet)
 * 2. API Error 500 (Internal Server Error)
 * 3. Network Latency / Delay
 */

type Listener = () => void;

class NetworkSimulatorService {
  private _isSimulatedOffline = false;
  private _isSimulatedServerError = false;
  private _simulatedDelayMs = 500;
  private _listeners = new Set<Listener>();

  get isSimulatedOffline(): boolean {
    return this._isSimulatedOffline;
  }

  get isSimulatedServerError(): boolean {
    return this._isSimulatedServerError;
  }

  get simulatedDelayMs(): number {
    return this._simulatedDelayMs;
  }

  setSimulatedOffline(val: boolean) {
    if (this._isSimulatedOffline !== val) {
      this._isSimulatedOffline = val;
      this.notify();
    }
  }

  setSimulatedServerError(val: boolean) {
    if (this._isSimulatedServerError !== val) {
      this._isSimulatedServerError = val;
      this.notify();
    }
  }

  setSimulatedDelayMs(ms: number) {
    this._simulatedDelayMs = ms;
    this.notify();
  }

  toggleSimulatedOffline() {
    this.setSimulatedOffline(!this._isSimulatedOffline);
  }

  toggleSimulatedServerError() {
    this.setSimulatedServerError(!this._isSimulatedServerError);
  }

  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this._listeners) {
      listener();
    }
  }
}

export const networkSimulator = new NetworkSimulatorService();

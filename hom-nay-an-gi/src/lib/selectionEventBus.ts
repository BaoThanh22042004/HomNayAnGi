/**
 * A simple event bus for coordinating selection changes across components
 * with built-in debouncing to reduce excessive updates
 */
const SelectionEventBus = {
  listeners: new Set<() => void>(),
  lastNotifyTime: 0,
  pendingNotification: null as NodeJS.Timeout | null,
  
  /**
   * Subscribe to selection change events
   * @param listener Function to call when a selection change occurs
   * @returns Unsubscribe function
   */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  /**
   * Notify all subscribers about a selection change
   * with built-in debouncing
   */
  notify() {
    const now = Date.now();
    
    // If we have a pending notification, clear it
    if (this.pendingNotification) {
      clearTimeout(this.pendingNotification);
      this.pendingNotification = null;
    }
    
    // If last notification was less than 300ms ago, debounce
    if (now - this.lastNotifyTime < 300) {
      this.pendingNotification = setTimeout(() => {
        this.lastNotifyTime = Date.now();
        this.pendingNotification = null;
        this.listeners.forEach(listener => listener());
      }, 300);
    } else {
      // Otherwise notify immediately
      this.lastNotifyTime = now;
      this.listeners.forEach(listener => listener());
    }
  }
};

/**
 * Call this function when selections have changed to notify all subscribers
 */
export function notifySelectionChange() {
  SelectionEventBus.notify();
}

/**
 * Subscribe to selection change events
 * @param listener Function to call when selections change
 * @returns Unsubscribe function
 */
export function subscribeToSelectionChanges(listener: () => void) {
  return SelectionEventBus.subscribe(listener);
}

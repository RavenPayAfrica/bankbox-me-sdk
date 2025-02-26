class EventWorker extends EventTarget {
  private handledEvents: Set<string>;
  private isIframe: boolean;

  constructor() {
    super();
    this.handledEvents = new Set();
    this.isIframe = window !== window.parent; // Check if running inside an iframe
    this.listenToMessages();
    this.setupClearInterval();
  }

  emit(type: string, data?: any): void {
    const event = new CustomEvent(type, { detail: data });
    this.dispatchEvent(event);

    // Send message to the parent if in an iframe, else send to all iframes
    if (this.isIframe) {
      window.parent.postMessage({ type, data }, "*");
    } else {
      this.broadcastToIframes(type, data);
    }
  }


  subscribe(key: string, callback: (event: CustomEvent) => void): void {
    const eventHandler = (e: CustomEvent) => {
      callback(e);
    };
    this.addEventListener(key, eventHandler);
  }

  private listenToMessages(): void {
    window.addEventListener("message", (event) => {
      if (!event.data || !event.data.type) return;
      const { type, data } = event.data;
      if (!this.handledEvents.has(type)) {
        this.handledEvents.add(type);
        this.dispatchEvent(new CustomEvent(type, { detail: data }));
      }
    });
  }

  private broadcastToIframes(type: string, data: any): void {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      iframe.contentWindow?.postMessage({ type, data }, "*");
    });
  }
  private setupClearInterval(): void {
    setInterval(() => {
      this.handledEvents.clear();
    }, 600); // Clear every 60 seconds
  }
}

export const $event = new EventWorker();
export default $event;

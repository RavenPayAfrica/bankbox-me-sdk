import eventWorker from "./eventWorker";

interface WidgetOptions {
  [key: string]: any;
  isPersistent?: boolean;
}

export interface Config {
  appName: string;
  environment?: 'sandbox' | 'production';
  widgetOptions?: WidgetOptions;
  containerId?: string;
  onBluethoothConnected?: (data: any) => void;
  onSuccess?: (data: any) => void;
  onFail?: (data: any) => void;
  onError?: (error: any) => void;
  onLoad?: () => void;
}




interface Message {
  type: string;
  data: any;
  message?: any;
}

interface MountOptions {
  email?: string;
  amount?: number;
  containerId?: string;
}
class BankboxManager {
  private appName: string = 'bankly';
  private environment?: 'development' | 'sandbox' | 'production' = 'production';
  private widgetOptions?: WidgetOptions;
  private containerId: string;
  private iframe: HTMLIFrameElement | null;
  private container: HTMLDivElement | null;
  private messageHandlers: Map<string, Set<(data: any) => void>>;
  private targetOrigin: string;
  public $event: typeof eventWorker;
  public isInitialized: boolean;
  private config = {}
  private windowSize = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  private paymentOption:Partial<MountOptions>= {}
  public isBluethoothConnected = false;
  public constants = {
    success: "success",
    fail: "fail",
    error: "error",
    event_hook: "bankbox_events",
    style_config: "style_config",
    load: 'load',
    sdkOpen: 'sdk:open',
    bluethoothConnected: 'sdk:bluetooth_connected',
    sdkPaymentData: "sdk:payment_data",
    systemReady: "sdk:system_ready",
    sdkClose: 'sdk:close',
    appUrl: this.environment === 'development' ? 'http://localhost:3000' : `https://${this.appName ?? 'bankly'}.bankbox.me`
  }
  constructor(config: Config) {
    this.appName = config.appName;
    this.environment = config.environment;
    this.widgetOptions = config.widgetOptions;
    this.containerId = config.containerId ?? 'bankbox-container';
    this.iframe = null;
    this.container = null;
    this.$event = eventWorker;
    this.messageHandlers = new Map();
    this.targetOrigin = this.getTargetOrigin();
    this.isInitialized = false;
    this.config = config;

    // Register event listeners
    this.registerCoreListeners(config);
  }
  private getTargetOrigin(params?:MountOptions): string {

    if (params && params.email){
    return `${this.constants.appUrl}?email=${params.email}`;
    }

    if(params && params.amount){
    return `${this.constants.appUrl}?amount=${params.amount}`;
    }

    return `${this.constants.appUrl}`;
  }
  private registerCoreListeners(config: Config): void {
      if (config.onSuccess) eventWorker.subscribe(this.constants.success, (e) => config.onSuccess?.(e.detail));
      if (config.onBluethoothConnected) eventWorker.subscribe(this.constants.bluethoothConnected, (e) => config.onBluethoothConnected?.(e.detail));
      if (config.onFail) eventWorker.subscribe(this.constants.fail, (e) => config.onFail?.(e.detail));
      if (config.onError) eventWorker.subscribe(this.constants.error, (e) => config.onError?.(e.detail));
      if (config.onLoad) eventWorker.subscribe(this.constants.load, () => config.onLoad?.());
  }

  private injectAnimationStyle = () => {
    const styleId = "moveBankBoxMeInnerWrapUp-style";

    // Check if style already exists
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes moveBankBoxMeInnerWrapUp {
          0% {
            transform: translateY(7%) translateX(-50%);
          }
          100% {
            transform: translateY(0%) translateX(-50%);
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  private initWindowResizeListener(): void {
    // Add an event listener to the window resize event
    window.addEventListener('resize', () => {


      this.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,}
        if(this.container){
          this.container.style.width = (this.windowSize.width > 900) ?  '50%' : '100%';
        }
    });

  }
  private initializeListeners(): void {
      eventWorker.subscribe(this.constants.event_hook, this.handleIncomingMessage.bind(this));
      eventWorker.subscribe(this.constants.bluethoothConnected, this.handleBluethoothConnected.bind(this));
      eventWorker.subscribe(this.constants.systemReady, this.handleBankboxReady.bind(this));
      this.initWindowResizeListener();
      this.injectAnimationStyle();
    }

  private initializeIframe(options?:MountOptions): void {
    if (!this.container) {
      this.container = document.getElementById(this.containerId) as HTMLDivElement;

      if (!this.container) {
        // The overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.id = 'bankbox-overlay';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.display = 'flex';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
        overlay.style.backdropFilter = 'blur(10px)'; // Blur effect
        overlay.style.zIndex = '9998'; // Ensure it is behind the container
        document.body.appendChild(overlay);

        //  The container
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.style.position = 'fixed';
        this.container.style.bottom = '0';
        this.container.style.left = '50%';
        this.container.style.width = (this.windowSize.width > 900) ?  '50%' : '100%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.height = '98%';
        this.container.style.zIndex = '9999';
        this.container.style.display = 'none';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = 'white';
        this.container.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
        this.container.style.borderTopLeftRadius = '30px';
        this.container.style.borderTopRightRadius = '30px';

        this.container.style.animation = "moveBankBoxMeInnerWrapUp 0.5s ease-in-out backwards";

        document.body.appendChild(this.container);

        // the close button
        const closeButton = document.createElement('span');
        closeButton.innerText = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.display = 'grid';
        closeButton.style.placeItems = 'center';
        closeButton.style.backgroundColor = 'black';
        closeButton.style.color = 'white';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '10000';

        // close button event listener
        closeButton.addEventListener('click', () => {
          this.container!.style.display = 'none';
          overlay.style.display = 'none';
        });

        this.container.appendChild(closeButton);
      }
    }
    if (!this.iframe) {
      this.iframe = document.createElement('iframe');
      this.iframe.style.display = 'none';
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      this.iframe.src = this.getTargetOrigin(options);
      this.iframe.allow = 'bluetooth';  // Allow Bluetooth

      this.iframe.onload = () => {
        this.isInitialized = true;
        this.dispatchEvent('load', null);
        window.addEventListener('message', this.handleIncomingMessage.bind(this));
      };

      this.iframe.onerror = (error) => {
        this.dispatchEvent('error', {
          type: 'iframe_error',
          message: 'Failed to load Bankbox iframe',
          error
        });
      };

      this.container.appendChild(this.iframe);
    }
  }

  private reinjectOverlay(){
    const o = document.getElementById('bankbox-overlay') as HTMLDivElement;
    if (!o) {
      // The overlay
      const overlay = document.createElement('span');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.id = 'bankbox-overlay';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.display = 'flex';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
      overlay.style.backdropFilter = 'blur(10px)'; // Blur effect
      overlay.style.zIndex = '9998'; // Ensure it is behind the container
      document.body.appendChild(overlay);
    } else {
      o.style.position = 'fixed';
      o.style.top = '0';
      o.id = 'bankbox-overlay';
      o.style.left = '0';
      o.style.width = '100%';
      o.style.display = 'flex';
      o.style.height = '100%';
      o.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
      o.style.backdropFilter = 'blur(10px)'; // Blur effect
      o.style.zIndex = '9998'; // Ensure it is behind the container
      document.body.appendChild(o);
    }
  }

  public mount(options?: MountOptions): void {
    if (options?.containerId) {
      const containerElement = document.getElementById(options?.containerId);
      if (!containerElement) {
        throw new Error(`Container element with id '${options?.containerId}' not found`);
      }
      this.container = containerElement as HTMLDivElement;
    } else {
      this.initializeIframe(options);
    }

    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.container.style.display = 'block';

    if (this.iframe && !this.iframe.parentElement) {
      this.container.appendChild(this.iframe);
    }

    this.iframe!.style.display = 'block';

    this.reinjectOverlay();
  }

  public open(options?: MountOptions) {
    this.mount(options);
    this.paymentOption = options ?? {};
    this.sendMessage({ type: this.constants.sdkOpen, data: undefined });
    this.initializeListeners();

    setTimeout(() => {
      this.initPayment(options);
    }, 1000);

    return {isBluethoothConnected: this.isBluethoothConnected}
  }

  public initPayment(options?: MountOptions): void {
    this.sendMessage({type: this.constants.sdkPaymentData, data: options, message: "SDK Payment Data Recieved"})
  }
  public close(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }

    const overlay = document.getElementById('bankbox-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    if (this.iframe) {
      this.iframe.style.display = 'none';
    }

    this.sendMessage({ type: this.constants.sdkClose, data: undefined });

  }

  private handleBluethoothConnected(data: any): void {
    this.isBluethoothConnected = true;
    this.initPayment(this.paymentOption);
  }
  private handleIncomingMessage(event: MessageEvent): void {
    if (event.origin !== this.targetOrigin) return;

    const message: Message = event.data
    if (!message?.type) return;

    switch (message.type) {
      case 'bankbox:ready':
        this.handleBankboxReady();
        break;
      case 'rrn_data':
        this.dispatchEvent(message.message?.status, message.data);
        break;
      case 'bankbox:close':
        this.close();
        break;
      default:
        this.dispatchEvent(message.type, message.data);
    }
  }

  private handleBankboxReady(): void {
    this.sendMessage({
      type: 'sdk:init',
      data: {
        environment: this.environment,
        ...this.widgetOptions
      }
    });
  }

  public addEventListener(type: string, callback: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(callback);
  }

  public removeEventListener(type: string, callback: (data: any) => void): void {
    this.messageHandlers.get(type)?.delete(callback);
  }

  private dispatchEvent(type: string, data: any): void {
    this.messageHandlers.get(type)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${type} handler:`, error);
      }
    });
  }
  public sendMessage(message: Message): void {
    eventWorker.emit(message.type, message);
  }

  public destroy(): void {
    window.removeEventListener('message', this.handleIncomingMessage);
    if (this.iframe?.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
    eventWorker.emit(this.constants.event_hook, null);

    this.iframe = null;
    this.isInitialized = false;
  }
}

export default BankboxManager;

// Browser types for the game environment
declare global {
  interface Window {
    addEventListener(type: string, listener: (event: MessageEvent) => void): void;
    parent: {
      postMessage(message: any, targetOrigin: string): void;
    };
    top: Window;
  }
  
  interface MessageEvent {
    data: any;
    origin: string;
  }
  
  const window: Window;
}

export {}; 
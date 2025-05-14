
/// <reference types="vite/client" />

// Extend the HTMLInputElement interface to include webkitdirectory attribute
declare namespace JSX {
  interface IntrinsicElements {
    input: React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: boolean },
      HTMLInputElement
    >;
  }
}

// Also extend the HTMLInputElement interface directly
interface HTMLInputElement {
  webkitdirectory?: boolean;
}

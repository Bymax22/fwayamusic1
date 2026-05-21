// Allow importing CSS and asset files in TypeScript for Next.js app
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';
declare module '*.svg' {
  import * as React from 'react';
  const content: string;
  export default content;
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}

export {};

declare module 'react-plotly.js' {
  import * as Plotly from 'plotly.js';
  import * as React from 'react';

  interface PlotParams {
    data?: Array<Partial<Plotly.PlotData>>;
    layout?: Partial<Plotly.Layout>;
    frames?: Array<Partial<Plotly.Frame>>;
    config?: Partial<Plotly.Config>;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    revision?: number;
    onInitialized?: (figure: Readonly<{
      data: Array<Plotly.PlotData>;
      layout: Plotly.Layout;
    }>) => void;
    onUpdate?: (figure: Readonly<{
      data: Array<Plotly.PlotData>;
      layout: Plotly.Layout;
    }>) => void;
    onPurge?: () => void;
    onError?: (err: Error) => void;
    divId?: string;
    className?: string;
    [key: string]: any;
  }

  const Plot: React.ComponentClass<PlotParams>;
  export default Plot;
} 
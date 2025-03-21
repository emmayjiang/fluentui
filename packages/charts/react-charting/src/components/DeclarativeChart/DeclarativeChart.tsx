/* eslint-disable @typescript-eslint/naming-convention */
import * as React from 'react';
import { useTheme } from '@fluentui/react';
import { IRefObject } from '@fluentui/react/lib/Utilities';
import { DonutChart } from '../DonutChart/index';
import { VerticalStackedBarChart } from '../VerticalStackedBarChart/index';
import { PlotData, PlotlySchema } from './PlotlySchema';
import {
  isArrayOrTypedArray,
  isDateArray,
  isNumberArray,
  isMonthArray,
  sanitizeJson,
  updateXValues,
  transformPlotlyJsonToDonutProps,
  transformPlotlyJsonToVSBCProps,
  transformPlotlyJsonToScatterChartProps,
  transformPlotlyJsonToHorizontalBarWithAxisProps,
  transformPlotlyJsonToHeatmapProps,
  transformPlotlyJsonToSankeyProps,
  transformPlotlyJsonToGaugeProps,
  transformPlotlyJsonToGVBCProps,
  transformPlotlyJsonToVBCProps,
  isLineData,
} from './PlotlySchemaAdapter';
import { LineChart, ILineChartProps } from '../LineChart/index';
import { HorizontalBarChartWithAxis } from '../HorizontalBarChartWithAxis/index';
import { AreaChart, IAreaChartProps } from '../AreaChart/index';
import { HeatMapChart } from '../HeatMapChart/index';
import { SankeyChart } from '../SankeyChart/SankeyChart';
import { GaugeChart } from '../GaugeChart/index';
import { GroupedVerticalBarChart } from '../GroupedVerticalBarChart/index';
import { VerticalBarChart } from '../VerticalBarChart/index';
import { IImageExportOptions, toImage } from './imageExporter';
import { IChart } from '../../types/index';
import { withResponsiveContainer } from '../ResponsiveContainer/withResponsiveContainer';

const ResponsiveDonutChart = withResponsiveContainer(DonutChart);
const ResponsiveVerticalStackedBarChart = withResponsiveContainer(VerticalStackedBarChart);
const ResponsiveLineChart = withResponsiveContainer(LineChart);
const ResponsiveHorizontalBarChartWithAxis = withResponsiveContainer(HorizontalBarChartWithAxis);
const ResponsiveAreaChart = withResponsiveContainer(AreaChart);
const ResponsiveHeatMapChart = withResponsiveContainer(HeatMapChart);
const ResponsiveSankeyChart = withResponsiveContainer(SankeyChart);
const ResponsiveGaugeChart = withResponsiveContainer(GaugeChart);
const ResponsiveGroupedVerticalBarChart = withResponsiveContainer(GroupedVerticalBarChart);
const ResponsiveVerticalBarChart = withResponsiveContainer(VerticalBarChart);

/**
 * DeclarativeChart schema.
 * {@docCategory DeclarativeChart}
 */
export interface Schema {
  /**
   * Plotly schema represented as JSON object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plotlySchema: any;
}

/**
 * DeclarativeChart props.
 * {@docCategory DeclarativeChart}
 */
export interface DeclarativeChartProps extends React.RefAttributes<HTMLDivElement> {
  /**
   * The schema representing the chart data, layout and configuration
   */
  chartSchema: Schema;

  /**
   * Callback when an event occurs
   */
  onSchemaChange?: (eventData: Schema) => void;

  /**
   * Optional callback to access the IDeclarativeChart interface. Use this instead of ref for accessing
   * the public methods and properties of the component.
   */
  componentRef?: IRefObject<IDeclarativeChart>;
}

/**
 * {@docCategory DeclarativeChart}
 */
export interface IDeclarativeChart {
  exportAsImage: (opts?: IImageExportOptions) => Promise<string>;
}

const useColorMapping = () => {
  const colorMap = React.useRef(new Map<string, string>());
  return colorMap;
};

/**
 * DeclarativeChart component.
 * {@docCategory DeclarativeChart}
 */
export const DeclarativeChart: React.FunctionComponent<DeclarativeChartProps> = React.forwardRef<
  HTMLDivElement,
  DeclarativeChartProps
>((props, forwardedRef) => {
  const { plotlySchema } = sanitizeJson(props.chartSchema);
  const plotlyInput = plotlySchema as PlotlySchema;
  let { selectedLegends } = plotlySchema;
  const colorMap = useColorMapping();
  const theme = useTheme();
  const isDarkTheme = theme?.isInverted ?? false;
  const chartRef = React.useRef<IChart>(null);

  if (!isArrayOrTypedArray(selectedLegends)) {
    selectedLegends = [];
  }

  const [activeLegends, setActiveLegends] = React.useState<string[]>(selectedLegends);
  const onActiveLegendsChange = (keys: string[]) => {
    setActiveLegends(keys);
    if (props.onSchemaChange) {
      props.onSchemaChange({ plotlySchema: { plotlyInput, selectedLegends: keys } });
    }
  };

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { plotlySchema } = sanitizeJson(props.chartSchema);
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { selectedLegends } = plotlySchema;
    setActiveLegends(selectedLegends ?? []);
  }, [props.chartSchema]);

  const multiSelectLegendProps = {
    canSelectMultipleLegends: true,
    onChange: onActiveLegendsChange,
    selectedLegends: activeLegends,
  };

  const commonProps = {
    legendProps: multiSelectLegendProps,
    componentRef: chartRef,
    calloutProps: { layerProps: { eventBubblingEnabled: true } },
  };

  const checkAndRenderChart = (
    renderChartJsx: (chartProps: ILineChartProps | IAreaChartProps) => JSX.Element,
    isAreaChart: boolean = false,
  ) => {
    let fallbackVSBC = false;
    const xValues = (plotlyInput.data[0] as PlotData).x;
    const isXDate = isDateArray(xValues);
    const isXNumber = isNumberArray(xValues);
    const isXMonth = isMonthArray(xValues);
    if (isXDate || isXNumber) {
      const chartProps: ILineChartProps | IAreaChartProps = {
        ...transformPlotlyJsonToScatterChartProps(
          { data: plotlyInput.data, layout: plotlyInput.layout },
          isAreaChart,
          colorMap,
          isDarkTheme,
        ),
        ...commonProps,
      };
      return renderChartJsx(chartProps);
    } else if (isXMonth) {
      const updatedData = plotlyInput.data.map((dataPoint: PlotData) => ({
        ...dataPoint,
        x: updateXValues(dataPoint.x),
      }));
      const chartProps: ILineChartProps | IAreaChartProps = {
        ...transformPlotlyJsonToScatterChartProps(
          { data: updatedData, layout: plotlyInput.layout },
          isAreaChart,
          colorMap,
          isDarkTheme,
        ),
        ...commonProps,
      };
      return renderChartJsx(chartProps);
    }
    // Unsupported schema, render as VerticalStackedBarChart
    fallbackVSBC = true;
    return (
      <ResponsiveVerticalStackedBarChart
        {...transformPlotlyJsonToVSBCProps(plotlySchema, colorMap, isDarkTheme, fallbackVSBC)}
        {...commonProps}
      />
    );
  };

  const exportAsImage = React.useCallback(
    (opts?: IImageExportOptions) => {
      return toImage(chartRef.current?.chartContainer, {
        background: theme.semanticColors.bodyBackground,
        scale: 5,
        ...opts,
      });
    },
    [theme],
  );

  React.useImperativeHandle(
    props.componentRef,
    () => ({
      exportAsImage,
    }),
    [exportAsImage],
  );

  switch (plotlyInput.data[0].type) {
    case 'pie':
      return (
        <ResponsiveDonutChart
          {...transformPlotlyJsonToDonutProps(plotlySchema, colorMap, isDarkTheme)}
          {...commonProps}
        />
      );
    case 'bar':
      const orientation = plotlyInput.data[0].orientation;
      if (orientation === 'h' && isNumberArray((plotlyInput.data[0] as PlotData).x)) {
        return (
          <ResponsiveHorizontalBarChartWithAxis
            {...transformPlotlyJsonToHorizontalBarWithAxisProps(plotlySchema, colorMap, isDarkTheme)}
            {...commonProps}
          />
        );
      } else {
        const containsLines = plotlyInput.data.some(
          series => series.type === 'scatter' || isLineData(series as Partial<PlotData>),
        );
        if (['group', 'overlay'].includes(plotlySchema?.layout?.barmode) && !containsLines) {
          return (
            <ResponsiveGroupedVerticalBarChart
              {...transformPlotlyJsonToGVBCProps(plotlySchema, colorMap, isDarkTheme)}
              {...commonProps}
            />
          );
        }
        return (
          <ResponsiveVerticalStackedBarChart
            {...transformPlotlyJsonToVSBCProps(plotlySchema, colorMap, isDarkTheme)}
            {...commonProps}
          />
        );
      }
    case 'scatter':
      if (plotlyInput.data[0]?.mode?.includes('markers') && !isNumberArray(plotlyInput.data[0].y!)) {
        throw new Error(
          `Unsupported chart - type :${plotlyInput.data[0]?.type}, mode: ${plotlyInput.data[0]?.mode}
          , xAxisType: String or Date`,
        );
      }
      const isAreaChart = plotlyInput.data.some(
        (series: PlotData) => series.fill === 'tonexty' || series.fill === 'tozeroy',
      );
      const isScatterMarkers = plotlyInput.data[0]?.mode?.includes('markers');
      const renderChartJsx = (chartProps: ILineChartProps | IAreaChartProps) => {
        if (isAreaChart) {
          return <ResponsiveAreaChart {...chartProps} />;
        }
        return <ResponsiveLineChart {...chartProps} lineMode={isScatterMarkers ? 'scatter' : 'default'} />;
      };
      return checkAndRenderChart(renderChartJsx, isAreaChart);
    case 'heatmap':
      return (
        <ResponsiveHeatMapChart
          {...transformPlotlyJsonToHeatmapProps(plotlySchema)}
          {...commonProps}
          legendProps={{}}
        />
      );
    case 'sankey':
      return (
        <ResponsiveSankeyChart
          {...transformPlotlyJsonToSankeyProps(plotlySchema, colorMap, isDarkTheme)}
          {...commonProps}
        />
      );
    case 'indicator':
    case 'gauge':
      if (plotlyInput.data?.[0]?.mode?.includes('gauge') || plotlyInput.data?.[0]?.type === 'gauge') {
        return (
          <ResponsiveGaugeChart
            {...transformPlotlyJsonToGaugeProps(plotlySchema, colorMap, isDarkTheme)}
            {...commonProps}
          />
        );
      }
      throw new Error(`Unsupported chart - type: ${plotlyInput.data[0]?.type}, mode: ${plotlyInput.data[0]?.mode}`);
    case 'histogram':
      return (
        <ResponsiveVerticalBarChart
          {...transformPlotlyJsonToVBCProps(plotlySchema, colorMap, isDarkTheme)}
          {...commonProps}
        />
      );
    default:
      const xValues = (plotlyInput.data[0] as PlotData).x;
      const yValues = (plotlyInput.data[0] as PlotData).y;
      if (xValues && yValues && xValues.length > 0 && yValues.length > 0) {
        const renderLineChartJsx = (chartProps: ILineChartProps) => {
          return <ResponsiveLineChart {...chartProps} />;
        };
        return checkAndRenderChart(renderLineChartJsx);
      }
      throw new Error(`Unsupported chart type :${plotlyInput.data[0]?.type}`);
  }
});
DeclarativeChart.displayName = 'DeclarativeChart';

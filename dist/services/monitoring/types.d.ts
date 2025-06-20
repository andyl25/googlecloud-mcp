/**
 * Interface for Google Cloud Monitoring time series data
 */
export interface TimeSeriesData {
    metric: {
        type: string;
        labels?: Record<string, string>;
    };
    resource: {
        type: string;
        labels: Record<string, string>;
    };
    metricKind: string;
    valueType: string;
    points: Array<{
        interval: {
            startTime: string;
            endTime: string;
        };
        value: {
            boolValue?: boolean;
            int64Value?: string;
            doubleValue?: number;
            stringValue?: string;
            distributionValue?: any;
        };
    }>;
}
/**
 * Initialises the Google Cloud Monitoring client
 *
 * @returns A configured Monitoring client
 */
export declare function getMonitoringClient(): any;
/**
 * Formats a time series data point for display
 *
 * @param timeSeries The time series data to format
 * @returns A formatted string representation of the time series data
 */
export declare function formatTimeSeriesData(timeSeries: TimeSeriesData[]): string;

/**
 * Represents a metric from the documentation
 */
export interface Metric {
    /** The full metric type (e.g., 'compute.googleapis.com/instance/cpu/utilization') */
    type: string;
    /** The display name of the metric */
    displayName: string;
    /** The description of the metric */
    description: string;
    /** The kind of metric (GAUGE, DELTA, CUMULATIVE) */
    kind: string;
    /** The value type (INT64, DOUBLE, DISTRIBUTION, etc.) */
    valueType: string;
    /** The unit of the metric */
    unit: string;
    /** The monitored resource types this metric applies to */
    monitoredResources: string[];
    /** The labels that can be used with this metric */
    labels: Array<{
        name: string;
        description: string;
    }>;
    /** The source documentation file this metric was found in */
    source: string;
}
/**
 * Categories of metrics documentation
 */
export declare enum MetricCategory {
    GCP = "gcp",
    Kubernetes = "kubernetes",
    Istio = "istio"
}
/**
 * Class to handle metric lookups from documentation
 */
export declare class MetricsLookup {
    private metrics;
    private initialized;
    private metricsDir;
    /**
     * Create a new MetricsLookup instance
     *
     * @param metricsDir The directory containing metrics markdown files
     */
    constructor(metricsDir: string);
    /**
     * Initialize the metrics lookup by parsing all metrics files
     */
    initialize(): Promise<void>;
    /**
     * Parse a metrics markdown file and extract metric information
     *
     * @param category The category of metrics to parse
     */
    private parseMetricsFile;
    /**
     * Find metrics based on a natural language query
     *
     * @param query The natural language query to search for
     * @param category Optional category to limit the search to
     * @param limit Maximum number of results to return
     * @returns Array of matching metrics
     */
    findMetrics(query: string, category?: MetricCategory, limit?: number): Metric[];
    /**
     * Extract key terms from a natural language query
     *
     * @param query The query to extract terms from
     * @returns Array of key terms
     */
    private extractKeyTerms;
    /**
     * Calculate a relevance score for a metric based on how well it matches the query terms
     *
     * @param metric The metric to score
     * @param terms The key terms from the query
     * @param fullQuery The full original query
     * @returns A relevance score (higher is better)
     */
    private calculateRelevanceScore;
    /**
     * Get a metric by its exact type
     *
     * @param metricType The full metric type to look up
     * @returns The metric or undefined if not found
     */
    getMetricByType(metricType: string): Metric | undefined;
    /**
     * Suggest a monitoring filter based on a natural language query
     *
     * @param query The natural language query
     * @returns A suggested monitoring filter string
     */
    suggestFilter(query: string): string;
}
export declare const metricsLookup: MetricsLookup;

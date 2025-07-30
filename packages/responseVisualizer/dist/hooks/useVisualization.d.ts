import { VisualizationConfig, ComponentConfig } from '../types';
export interface UseVisualizationOptions {
    /** Initial configuration */
    initialConfig?: VisualizationConfig;
    /** Auto-validate configuration changes */
    autoValidate?: boolean;
    /** Debounce delay for validation (ms) */
    validationDelay?: number;
    /** Error callback */
    onError?: (error: Error) => void;
    /** Loading state callback */
    onLoadingChange?: (loading: boolean) => void;
}
export interface UseVisualizationReturn {
    /** Current configuration */
    config: VisualizationConfig | null;
    /** Validation errors */
    errors: string[];
    /** Loading state */
    loading: boolean;
    /** Is configuration valid */
    isValid: boolean;
    /** Set new configuration */
    setConfig: (config: VisualizationConfig) => void;
    /** Update configuration */
    updateConfig: (updater: (config: VisualizationConfig) => VisualizationConfig) => void;
    /** Add component */
    addComponent: (component: ComponentConfig, index?: number) => void;
    /** Remove component */
    removeComponent: (index: number) => void;
    /** Update component */
    updateComponent: (index: number, component: ComponentConfig) => void;
    /** Clear configuration */
    clear: () => void;
    /** Reload configuration */
    reload: () => void;
    /** Export configuration */
    exportConfig: () => string;
    /** Import configuration */
    importConfig: (configString: string) => boolean;
}
/**
 * Hook for managing visualization configuration
 */
export declare function useVisualization(options?: UseVisualizationOptions): UseVisualizationReturn;
//# sourceMappingURL=useVisualization.d.ts.map
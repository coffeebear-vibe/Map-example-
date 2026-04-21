export interface RemediationSession {
  file: {
    name: string;
    size: number;
    isScanned: boolean;
    isPasswordProtected: boolean;
  };
  analysis: {
    metadata: {
      title: string | null;
      author: string | null;
      language: string | null;
    };
    images: Array<{
      id: string;
      pageIndex: number;
      preview: string;
      hasAlt: boolean;
      currentAlt: string | null;
      bbox: { x: number; y: number; width: number; height: number } | null;
    }>;
    hasStructureTree: boolean;
    hasMarkInfo: boolean;
    formFields: Array<{
      id: string;
      name: string;
      type: string;
      hasAccessibleName: boolean;
    }>;
    tables: Array<{
      id: string;
      hasHeaders: boolean;
    }>;
  };
  fixes: {
    metadata: { title: string; author: string; language: string } | null;
    altText: Record<string, string>; // imageId -> alt text, "" means decorative
    contrastConfirmed: boolean;
    formFields: Record<string, string>; // fieldId -> accessible label
    tablesAcknowledged: boolean;
  };
  currentStep: string;
  completedSteps: string[];
}

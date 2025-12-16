import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SlotData } from '@/components/ImageSlots';
import { saveWizardDraft, loadWizardDraft, clearWizardDraft } from '@/lib/wizardStorage';

export interface FormData {
  title: string;
  price: string;
  location: string;
  size?: string;
  beds?: string;
  baths?: string;
  sprat?: string;
  extras?: string;
  logo_size?: number;
}

export interface WizardData {
  formData: FormData;
  slots: SlotData[];
  clipCount: 5 | 6;
  currentStep: 1 | 2 | 3;
}

interface WizardContextType {
  wizardData: WizardData;
  setWizardData: (data: WizardData | ((prev: WizardData) => WizardData)) => void;
  updateFormData: (data: FormData) => void;
  updateSlots: (slots: SlotData[]) => void;
  updateClipCount: (count: 5 | 6) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  resetWizard: () => void;
}

const defaultWizardData: WizardData = {
  formData: { title: '', price: '', location: '' },
  slots: Array.from({ length: 5 }, (_, i) => ({
    id: `slot-${i}`,
    mode: 'image-to-video' as const,
    images: []
  })),
  clipCount: 5 as const,
  currentStep: 1,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [wizardData, setWizardData] = useState<WizardData>(defaultWizardData);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    const restoreData = async () => {
      try {
        const restored = await loadWizardDraft();
        if (restored) {
          setWizardData(restored);
        }
      } catch (error) {
        console.error('Failed to restore wizard data:', error);
      } finally {
        setIsRestored(true);
      }
    };
    restoreData();
  }, []);

  useEffect(() => {
    if (!isRestored) return;

    const saveData = async () => {
      try {
        // Calculate total size of images
        const totalSize = wizardData.slots.reduce((sum, slot) =>
          sum + slot.images.reduce((imgSum, img) => imgSum + img.size, 0), 0
        );

        // Only save if total size is under 50MB to prevent crashes
        if (totalSize < 50 * 1024 * 1024) {
          await saveWizardDraft(wizardData);
        } else {
          console.warn('Skipping auto-save: images too large', totalSize / 1024 / 1024, 'MB');
        }
      } catch (error) {
        console.error('Failed to save wizard data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 2000);
    return () => clearTimeout(timeoutId);
  }, [wizardData, isRestored]);

  const updateFormData = (data: FormData) => {
    setWizardData(prev => ({ ...prev, formData: data }));
  };

  const updateSlots = (slots: SlotData[]) => {
    setWizardData(prev => ({ ...prev, slots }));
  };

  const updateClipCount = (count: 5 | 6) => {
    setWizardData(prev => {
      const newSlots = Array.from({ length: count }, (_, i) => {
        // Keep existing slot if it exists, otherwise create new one
        return prev.slots[i] || {
          id: `slot-${i}`,
          mode: 'image-to-video' as const,
          images: []
        };
      });

      return {
        ...prev,
        clipCount: count,
        slots: newSlots
      };
    });
  };

  const setCurrentStep = (step: 1 | 2 | 3) => {
    setWizardData(prev => ({ ...prev, currentStep: step }));
  };

  const resetWizard = async () => {
    setWizardData(defaultWizardData);
    try {
      await clearWizardDraft();
    } catch (error) {
      console.error('Failed to clear wizard draft:', error);
    }
  };

  return (
    <WizardContext.Provider value={{
      wizardData,
      setWizardData,
      updateFormData,
      updateSlots,
      updateClipCount,
      setCurrentStep,
      resetWizard
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

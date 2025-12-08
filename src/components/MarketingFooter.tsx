import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/translations';

export function MarketingFooter() {
  const { language } = useLanguage();
  const t = translations[language].footer;

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t.rights}
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              to="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.terms}
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
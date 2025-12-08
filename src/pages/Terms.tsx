import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/translations';

export default function Terms() {
  const { language } = useLanguage();
  const t = translations[language].terms;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link to="/">← {t.back}</Link>
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-8">{t.title}</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            {t.lastUpdated}: {new Date().toLocaleDateString(language === 'sr' ? 'sr-RS' : 'en-US')}
          </p>

          {Object.values(t.sections).map((section: any, index) => (
            <section key={index} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
              {section.content && <p className="mb-4">{section.content}</p>}
              {section.list && (
                <ul className="list-disc pl-6 mb-4">
                  {section.list.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
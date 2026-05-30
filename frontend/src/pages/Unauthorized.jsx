import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="h-full flex min-w-0 items-center justify-center bg-brand-surface px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md overflow-hidden rounded-3xl border-brand-surface-border bg-brand-card shadow-sm">
        <CardHeader className="pt-10 text-center">
          <div className="mb-6 flex min-w-0 justify-center">
            <div className="rounded-full border border-brand-surface-border bg-brand-primary-tint p-4">
              <ShieldAlert className="h-10 w-10 text-brand-primary shrink-0" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-brand-ink">
            {t('unauthorizedPage.title')}
          </CardTitle>
          <CardDescription className="mt-2 text-sm font-bold uppercase tracking-widest text-brand-ink-muted">
            {t('unauthorizedPage.code')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="pb-2 text-center font-medium text-brand-ink-muted break-words">
            {t('unauthorizedPage.description')}
          </p>
        </CardContent>
        <CardFooter className="flex min-w-0 justify-center pb-10">
          <Button
            onClick={() => navigate('/')}
            className="h-auto w-full rounded-full bg-brand-primary px-8 py-6 font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-primary-deep sm:w-auto"
          >
            {t('unauthorizedPage.action')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Unauthorized;

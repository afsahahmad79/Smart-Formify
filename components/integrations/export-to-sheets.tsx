import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ExportToSheetsButtonProps {
  formData: any;
  spreadsheetId: string;
}

export function ExportToSheetsButton({ formData, spreadsheetId }: ExportToSheetsButtonProps) {
  const handleExport = async () => {
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          spreadsheetId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export to Google Sheets');
      }

      await response.json();
      
      toast({
        title: 'Success',
        description: 'Data exported to Google Sheets successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data to Google Sheets',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      Export to Google Sheets
    </Button>
  );
}

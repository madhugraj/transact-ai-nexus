
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, Mail, Paperclip, Check } from 'lucide-react';

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  labels: string[];
}

interface EmailListProps {
  emails: GmailMessage[];
  selectedEmails: GmailMessage[];
  isLoading: boolean;
  onEmailSelect: (email: GmailMessage) => void;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmails,
  isLoading,
  onEmailSelect
}) => {
  return (
    <Card className="max-h-80 overflow-y-auto">
      {isLoading ? (
        <div className="p-4 text-center">
          <Loader className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading emails...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No emails found
        </div>
      ) : (
        <div className="divide-y">
          {emails.map((email) => (
            <div
              key={email.id}
              className="p-3 hover:bg-muted/40 cursor-pointer"
              onClick={() => onEmailSelect(email)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium truncate">
                      {email.subject}
                    </span>
                    {email.hasAttachments && (
                      <Paperclip className="h-3 w-3 text-gray-500" />
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-1">
                    From: {email.from} • {new Date(email.date).toLocaleDateString()}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2 truncate">
                    {email.snippet}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {email.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex h-4 w-4 rounded border border-primary ml-2">
                  {selectedEmails.some(e => e.id === email.id) && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default EmailList;

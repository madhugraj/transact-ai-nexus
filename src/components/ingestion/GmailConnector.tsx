
import GmailConnectorRefactored from './gmail/GmailConnectorRefactored';

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  labels: string[];
}

interface GmailConnectorProps {
  onEmailsImported?: (emails: GmailMessage[]) => void;
}

const GmailConnector = (props: GmailConnectorProps) => {
  return <GmailConnectorRefactored {...props} />;
};

export default GmailConnector;

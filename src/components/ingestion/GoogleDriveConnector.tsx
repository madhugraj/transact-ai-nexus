
import GoogleDriveConnectorRefactored from './drive/GoogleDriveConnectorRefactored';

interface GoogleDriveConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const GoogleDriveConnector = (props: GoogleDriveConnectorProps) => {
  return <GoogleDriveConnectorRefactored {...props} />;
};

export default GoogleDriveConnector;

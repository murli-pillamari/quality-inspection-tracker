import InspectionTracker from "./components/InspectionTracker";
import AuthGate from "./components/AuthGate";

export default function App() {
  return <AuthGate>{({ onLogout }) => <InspectionTracker onLogout={onLogout} />}</AuthGate>;
}

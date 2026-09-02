import { AuthProvider } from "./context/AuthContext";
import NafpoAcademyLanding from "./components/NafpoAcademyLanding";

const App = () => {
  return (
    <AuthProvider>
      <NafpoAcademyLanding />
    </AuthProvider>
  );
};

export default App;


import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import './index.css';

function App() {
  return (
    <DataProvider>
      <Layout />
    </DataProvider>
  );
}

export default App;

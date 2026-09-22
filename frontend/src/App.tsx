// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from '@/compartilhado/contextos/AuthContext';
import { obterTemaLojas } from '@/compartilhado/temas/temaMui';
import { Roteador } from '@/Roteador';

const AppComTema: React.FC = () => {
  const { modoTema } = useAuth();
  const tema = React.useMemo(() => obterTemaLojas(modoTema), [modoTema]);

  return (
    <ThemeProvider theme={tema}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={4000}>
        <Roteador />
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppComTema />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

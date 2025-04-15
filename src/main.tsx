import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase';
import { CustomerProvider } from './contexts/CustomerContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <CustomerProvider>
        <App />
      </CustomerProvider>
    </SessionContextProvider>
  </React.StrictMode>
); 
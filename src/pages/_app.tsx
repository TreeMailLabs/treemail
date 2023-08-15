import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
import { useMemo, useState } from 'react';
import Head from 'next/head';
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from 'next-themes';
import { ToastContainer, toast } from 'react-toastify';
import ModalsContainer from '@/components/modal-views/container';
import DrawersContainer from '@/components/drawer-views/container';
import 'swiper/css';
import '@/assets/css/scrollbar.css';
import '@/assets/css/globals.css';
import '@/assets/css/range-slider.css';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import 'react-toastify/dist/ReactToastify.css';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'Leo Demo App',
      }),
    ],
    []
  );
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => page);
  //could remove this if you don't need to page level layout
  return (
    <>
      <Head>
        {/* maximum-scale 1 meta tag need to prevent ios input focus auto zooming */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 maximum-scale=1"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <WalletProvider
            wallets={wallets}
            decryptPermission={DecryptPermission.UponRequest}
            autoConnect
          >
            <WalletModalProvider>
              <ThemeProvider
                attribute="class"
                enableSystem={false}
                defaultTheme="dark"
              >
                {getLayout(<Component {...pageProps} />)}
                <ModalsContainer />
                <DrawersContainer />
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover={false}
                />
              </ThemeProvider>
            </WalletModalProvider>
          </WalletProvider>
        </Hydrate>
      </QueryClientProvider>
    </>
  );
}

export default CustomApp;

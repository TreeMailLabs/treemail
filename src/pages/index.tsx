import React, { useState, useEffect, FormEvent, SyntheticEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import cn from 'classnames';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button from '@/components/ui/button';
import { toast } from 'react-toastify';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';

function stringToBigInt(input: any) {
  const encoder = new TextEncoder();
  const encodedBytes = encoder.encode(input);

  let bigIntValue = BigInt(0);
  for (let i = 0; i < encodedBytes.length; i++) {
    const byteValue = BigInt(encodedBytes[i]);
    const shiftedValue = byteValue << BigInt(8 * i);
    bigIntValue = bigIntValue | shiftedValue;
  }

  return bigIntValue;
}

const ComposePage: NextPageWithLayout = () => {
  let [programId] = useState('private_dmail_v1.aleo'); // fixed
  let [functionName] = useState('send'); // fixed

  let [transactionId, setTransactionId] = useState<string | undefined>();
  let [loading, setLoading] = useState<boolean>(false);

  const { wallet, publicKey } = useWallet();

  const [params, setParams] = useState({
    to: '',
    content: '',
  });

  const changeParams = (key: string) => (event: any) => {
    setParams({
      ...params,
      [key]: event.target.value,
    });
  };

  const handleSubmit = async (event: any) => {
    try {
      setLoading(true);
      event.preventDefault();
      if (!publicKey) throw new WalletNotConnectedError();
      const parsedInputs = [
        params.to,
        `${stringToBigInt(params.content)}field`,
        `${new Date().getTime()}u64`,
      ];
      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        programId,
        functionName,
        parsedInputs,
        1000000
      );
      const txId =
        (await (wallet?.adapter as LeoWalletAdapter).requestTransaction(
          aleoTransaction
        )) || '';
      setTransactionId(txId);
    } catch (e: any) {
      toast(e.reason || e.message || e.name);
      setLoading(false);
    }
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(txId);
    if (status === 'Completed') {
      setTransactionId('');
      toast('Send success');
      setParams({
        to: '',
        content: '',
      });
      setLoading(false);
    }
    if (status === 'Failed') {
      setTransactionId('');
      toast('Send Failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId!);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactionId]);

  const canSubmit = Boolean(params.to && params.content);

  return (
    <>
      <NextSeo title="TreeMail - Compose" description="Create a new email" />
      <form
        className="space-y-4"
        noValidate
        role="search"
        onSubmit={async (event: SyntheticEvent<HTMLFormElement>) => {
          await handleSubmit(event);
        }}
      >
        <label className="flex w-full items-center">
          <span className="pointer-events-none flex h-full w-28 cursor-pointer text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
            From
          </span>
          <input
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 px-4 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            value={publicKey as string}
            placeholder="From"
            readOnly
          />
        </label>
        <label className="flex w-full items-center">
          <span className="pointer-events-none flex h-full w-28 cursor-pointer text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
            To
          </span>
          <input
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 px-4 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="To"
            autoComplete="off"
            value={params.to}
            onChange={changeParams('to')}
          />
        </label>
        <label className="flex w-full items-center">
          <span className="pointer-events-none flex h-full w-28 cursor-pointer text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
            Message
          </span>
          <textarea
            rows={5}
            className="w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-2 px-4 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="Email Content"
            autoComplete="off"
            value={params.content}
            onChange={changeParams('content')}
          />
        </label>
        <div>
          <Button
            type="submit"
            color="white"
            disabled={!canSubmit}
            className={cn('ml-28 shadow-card md:h-10 md:px-5 xl:h-12 xl:px-7', {
              'dark:bg-gray-700': !canSubmit,
              'dark:bg-purple-700': canSubmit,
            })}
            isLoading={loading}
          >
            {publicKey ? 'Send Email' : 'Connect Wallet'}
          </Button>
        </div>
      </form>
    </>
  );
};

ComposePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ComposePage;

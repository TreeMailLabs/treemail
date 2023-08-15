import React, { useState, useEffect, useRef } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import moment from 'moment';
import { isEmpty } from 'lodash';
import classNames from 'classnames';

function bigIntToString(bigIntValue: any) {
  const bytes = [];
  let tempBigInt = bigIntValue;

  while (tempBigInt > BigInt(0)) {
    const byteValue = Number(tempBigInt & BigInt(255));
    bytes.push(byteValue);
    tempBigInt = tempBigInt >> BigInt(8);
  }

  const decoder = new TextDecoder();
  const asciiString = decoder.decode(Uint8Array.from(bytes));
  return asciiString;
}

function parseAddr(addr: string) {
  return addr.slice(0, 4) + '...' + addr.slice(addr.length - 4);
}

const InboxPage: NextPageWithLayout = () => {
  const load = useRef(0);
  const { publicKey, requestRecords, wallet } = useWallet();

  const [list, setRecords] = useState<any>([]);

  const [current, setCurrent] = useState<any>({});

  const parseData = (str: string) => {
    try {
      const source = bigIntToString(BigInt(str.replace('field.private', '')));
      return {
        subject: source.slice(0, 20),
        content: source,
      };
    } catch (e) {
      return {};
    }
  };
  const loadRecords = async () => {
    const program = 'private_dmail_v1.aleo';
    if (!publicKey) return;
    if (requestRecords) {
      const records = await requestRecords(program);
      console.log(records);
      setRecords(
        records
          .map((item) => ({
            ...item,
            data: {
              ...item.data,
              from: item.data.from.slice(0, -8),
              time: item.data.time.slice(0, -11),
              ...parseData(item.data.data),
            },
          }))
          .filter(({ data }: any) => Boolean(data.subject))
      );
    }
  };

  const doSelectItem = (data: any) => {
    setCurrent(data);
  };

  useEffect(() => {
    if (publicKey && load.current === 0) {
      load.current = 1;
      loadRecords();
    }
  }, [publicKey]);

  return (
    <>
      <NextSeo title="TreeMail - Inbox" description="Create a new email" />
      <div className="flex h-full text-sm">
        <div className="min-h-[80vh] w-[240px] border-r border-gray-800">
          {list.map(({ data, id }: any) => (
            <div
              key={id}
              onClick={() => doSelectItem({ ...data, id })}
              className={classNames(
                'cursor-pointer border-b border-gray-800 px-4 py-2',
                {
                  'bg-slate-900': current.id === id,
                }
              )}
            >
              <div className="flex justify-between">
                <div>{parseAddr(data.from)}</div>
                <div className="text-xs text-gray-400">
                  {moment(Number(data.time)).format('MM/DD HH:mm')}
                </div>
              </div>
              <div className="mt-2 text-gray-500">{data.subject}</div>
            </div>
          ))}
          {list.length === 0 && <div>No data.</div>}
        </div>
        <div className="flex-1 px-4">
          {!isEmpty(current) && (
            <div className="space-y-2 text-gray-300">
              <div>From: {current.from}</div>
              <div>Subject: {current.subject}</div>
              <div>
                Date:{' '}
                {moment(Number(current.time)).format('YYYY/MM/DD HH:mm:ss')}
              </div>
              <div className="pt-4">{current.content}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

InboxPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default InboxPage;

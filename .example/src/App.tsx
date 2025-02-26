import React, { useEffect, useRef } from 'react';
import BankboxManager from '../../src/index';
import $event from '../../src/eventWorker';
// import BankboxManager from '@ravenpay/bankbox-me-sdk';

const BankboxWidget: React.FC = () => {
  const bankbox = new BankboxManager({
    appName: 'lumi',
    environment: 'development',
    // containerId: 'bankbox-container',
    // widgetOptions: {
    //   theme: 'dark',
    //   paymentMethod: 'card'
    // },
    widgetOptions: {
      isPersistent: true,
    },

    onSuccess: (data) => {
      console.log('Payment succeeded:', data);
    },
    onLoad: () => {
      console.log('Bankbox is ready');
    },
    onFail: (data) => {},
    onError: (error) => {
      console.error('An error occurred:', error);
    }
  });

     $event.subscribe("sdk:payment_data", (event) => {
      console.log(event, "thadt evnt")
     });
  function handleOpen() {
    const resp = bankbox.open({
      amount: 533
    });


    console.log('Open response:', resp);
  }


    return <React.Fragment>
       <button onClick={() => handleOpen()}>
          Open
        </button>

        <button onClick={() => bankbox.$event.emit(bankbox.constants.success, 'That was a success')}>
          sendSuccess
        </button>

        <button onClick={() => alert(`Bankbox is ${bankbox.$event ? 'connected' : 'disconnected'}`)}>
          Check Connection
        </button>

        <button onClick={() => (bankbox.$event.emit(bankbox.constants.sdkPaymentData, {amount: 1000}))}>
          Update amount
        </button>
    </React.Fragment>
};

export default BankboxWidget;

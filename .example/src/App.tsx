import React, { useEffect, useRef } from 'react';
// import BankboxManager from '../../dist';
import BankboxManager from '@ravenpay/bankbox-me-sdk';

const BankboxWidget: React.FC = () => {
  const bankbox = new BankboxManager({
    appName: 'bankly',
    // environment: 'sandbox',
    // containerId: 'bankbox-container',
    // widgetOptions: {
    //   theme: 'dark',
    //   paymentMethod: 'card'
    // },
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

  function handleOpen() {
    const resp = bankbox.open({
      email: ''
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
    </React.Fragment>
};

export default BankboxWidget;

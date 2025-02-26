# Bankbox SDK Documentation

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [BankboxManager](#bankboxmanager)
  - [Event System](#event-system)
- [API Reference](#api-reference)
  - [BankboxManager Configuration](#bankboxmanager-configuration)
  - [Methods](#methods)
  - [Events](#events)
- [Troubleshooting](#troubleshooting)

## Introduction

Bankbox Me SDK is a flexible payment integration solution that allows you to seamlessly embed payment functionality into your web applications. It provides a simple API for initializing payment widgets, handling payment flows, and managing the payment experience for your users.

## Installation

```bash
# Using npm
npm install @ravenpay/bankbox-me-sdk

# Using yarn
yarn add @ravenpay/bankbox-me-sdk
```

## Quick Start

Here's a basic implementation to get started with Bankbox SDK:

```jsx
import React from 'react'
import BankboxManager from '@ravenpay/bankbox-me-sdk'

const PaymentComponent = () => {
  // Initialize the Bankbox manager
  const bankbox = new BankboxManager({
    appName: 'your-app-name',
    environment: 'production', // or 'development'
    widgetOptions: {
      isPersistent: true,
    },
    onSuccess: (data) => {
      console.log('Payment succeeded:', data)
    },
    onLoad: () => {
      console.log('Bankbox is ready')
    },
    onError: (error) => {
      console.error('An error occurred:', error)
    },
  })

  // Function to initiate payment
  const handlePayment = () => {
    bankbox.open({
      amount: 1000, // Amount in smallest currency unit
    })
  }

  return (
    <div>
      <button onClick={handlePayment}>Pay Now</button>

      <button
        onClick={() =>
          alert(
            `Bankbox is ${
              bankbox.isBluethoothConnected ? 'connected' : 'disconnected'
            }`
          )
        }
      >
        Check Connection Status
      </button>
    </div>
  )
}

export default PaymentComponent
```

### Legacy CRA

If you encounter issues running the SDK with create-react-app (CRA), which has become obsolete, you can use the following approach. This method accesses the bundle file directly, bypassing React auto-import.

Here's a basic implementation to get started with Bankbox SDK:

```jsx
import React from 'react'
import BankboxManager from '@ravenpay/bankbox-me-sdk/bundles/index.esm.js'

// The rest of the implementation follows...
```

## Core Concepts

### BankboxManager

The `BankboxManager` is the main entry point for the SDK. It handles initialization, configuration, and provides methods to control the payment flow.

### Event System

Bankbox uses an event system to handle communication between your application and the payment widget. This enables you to receive updates and send data to the payment flow.

## API Reference

### BankboxManager Configuration

When initializing the `BankboxManager`, you can provide the following configuration options:

| Option          | Type     | Description                          | Required | Default |
| --------------- | -------- | ------------------------------------ | -------- | ------- |
| `appName`       | string   | Your application's identifier        | Yes      | -       |
| `environment`   | string   | 'development' or 'production'        | Yes      | -       |
| `containerId`   | string   | ID of the container element          | No       | -       |
| `widgetOptions` | object   | Configuration for the payment widget | No       | `{}`    |
| `onSuccess`     | function | Callback when payment succeeds       | No       | -       |
| `onLoad`        | function | Callback when widget loads           | No       | -       |
| `onFail`        | function | Callback when payment fails          | No       | -       |
| `onError`       | function | Callback when an error occurs        | No       | -       |

#### Widget Options

| Option          | Type    | Description                        | Default |
| --------------- | ------- | ---------------------------------- | ------- |
| `isPersistent`  | boolean | Keep widget instance after closure | `false` |
| `theme`         | string  | 'light' or 'dark'                  | 'light' |
| `paymentMethod` | string  | Default payment method             | -       |

### Methods

#### `open(options)`

Opens the payment widget with the specified options.

**Parameters:**

- `options` (object):
  - `amount` (number): The payment amount in the smallest currency unit

**Returns:** Boolean - `true` if the widget was opened successfully, `false` otherwise

```javascript
const opened = bankbox.open({ amount: 1000 })
if (opened) {
  console.log('Payment widget opened successfully')
}
```

#### `close()`

Closes the payment widget.

```javascript
bankbox.close()
```

#### `isBluethoothConnected`

Checks if the SDK is properly connected and ready to use, this value returns a boolean.

**Returns:** Boolean - `true` if connected, `false` otherwise

```javascript
if (bankbox.isBluethoothConnected) {
  console.log('Bankbox is connected and ready')
} else {
  console.log('Bankbox is not connected yet')
}
```

### Events

The SDK allows you to handle various payment events:

#### Available Events

The SDK provides constants for common events that you can listen for in your callbacks:

- `onSuccess`: Called when payment completes successfully
- `onFail`: Called when payment fails
- `onError`: Called when an error occurs
- `onLoad`: Called when the Bankbox widget is fully loaded

#### Updating Payment Data

You can update the payment details using events. For example, you can update the payment amount dynamically based on user input.

TIP: You can hook this to your input element's `onChange` event.

```javascript
// Updating payment amount
bankbox.$event.emit(bankbox.constants.sdkPaymentData, { amount: 1500 })
```

Here's an example of how to use the `onChange` event to update the payment amount:

```jsx
import React, { useState } from 'react'
import BankboxManager from '@ravenpay/bankbox-me-sdk'

const PaymentComponent = () => {
  const [amount, setAmount] = useState(1000)
  const bankbox = new BankboxManager({
    appName: 'your-app-name',
    environment: 'production',
    widgetOptions: {
      isPersistent: true,
    },
    onSuccess: (data) => {
      console.log('Payment succeeded:', data)
    },
    onLoad: () => {
      console.log('Bankbox is ready')
    },
    onError: (error) => {
      console.error('An error occurred:', error)
    },
  })

  const handleAmountChange = (event) => {
    const newAmount = parseInt(event.target.value, 10)
    setAmount(newAmount)
    bankbox.$event.emit(bankbox.constants.sdkPaymentData, { amount: newAmount })
  }

  const handlePayment = () => {
    bankbox.open({ amount })
  }

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={handleAmountChange}
        placeholder="Enter amount"
      />
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  )
}

export default PaymentComponent
```

## Troubleshooting

### Widget Not Appearing

Ensure that:

- You've provided a valid `appName` and `environment`
- The container element exists (if `containerId` is specified)

### Payment Processing Issues

If payments aren't processing correctly:

- Verify the amount is in the correct format (smallest currency unit)
- Ensure all required payment fields are provided
- Check your callbacks are properly handling success and error cases
- Check that `isBluethootConnected` returns `true` before attempting to process payment

### Best Practices

- Always check connection status before initiating payment flows
- Implement proper error handling in your callbacks
- Test thoroughly in development before moving to production
- Provide clear feedback to users during or after the payment process
- Hooking into the onSuccess & onFailure would allow take custom actions in your application based on transaction status

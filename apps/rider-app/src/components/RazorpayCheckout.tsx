import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import TopBar from './TopBar';
import { colors } from '../theme/theme';

export type CheckoutOrder = {
  chargeId: string;
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
};

export type PaymentResult = { orderId: string; paymentId: string; signature: string };

type Props = {
  order: CheckoutOrder | null;
  prefill?: { name?: string; contact?: string };
  onSuccess: (result: PaymentResult) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
};

// Razorpay's native SDK can't run in Expo Go, so we host the standard web
// Checkout (checkout.js) inside a WebView and bridge the result back to RN.
function buildHtml(order: CheckoutOrder, prefill?: { name?: string; contact?: string }) {
  const options = {
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: 'RideNow',
    description: 'Ride fare',
    prefill: { name: prefill?.name ?? '', contact: prefill?.contact ?? '' },
    theme: { color: '#000000' },
  };
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /></head>
<body style="background:#f9f9f9;margin:0">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  function post(msg){ window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  var options = ${JSON.stringify(options)};
  options.handler = function(r){
    post({ event:'success', paymentId:r.razorpay_payment_id, orderId:r.razorpay_order_id, signature:r.razorpay_signature });
  };
  options.modal = { ondismiss: function(){ post({ event:'dismiss' }); } };
  try {
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(resp){ post({ event:'failed', message: resp.error && resp.error.description }); });
    rzp.open();
  } catch (e) { post({ event:'failed', message: String(e) }); }
</script>
</body>
</html>`;
}

export default function RazorpayCheckout({ order, prefill, onSuccess, onDismiss, onError }: Props) {
  const handleMessage = (raw: string) => {
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    switch (data.event) {
      case 'success':
        onSuccess({ orderId: data.orderId, paymentId: data.paymentId, signature: data.signature });
        break;
      case 'failed':
        onError(data.message ?? 'Payment failed');
        break;
      case 'dismiss':
      default:
        onDismiss();
        break;
    }
  };

  return (
    <Modal visible={!!order} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <TopBar title="Secure payment" onBack={onDismiss} backIcon="close" />
        {order ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: buildHtml(order, prefill), baseUrl: 'https://checkout.razorpay.com' }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={(e) => handleMessage(e.nativeEvent.data)}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});

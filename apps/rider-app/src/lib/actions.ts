import { Alert, Linking, Share } from 'react-native';

/** Place a phone call, falling back to an alert if the device can't dial. */
export async function callNumber(number: string) {
  const url = `tel:${number}`;
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Call', `Dial ${number}`);
    }
  } catch {
    Alert.alert('Call', `Dial ${number}`);
  }
}

/** Open the OS share sheet with the given message. */
export async function shareMessage(message: string) {
  try {
    await Share.share({ message });
  } catch {
    /* user dismissed the share sheet */
  }
}

/** Confirm a destructive action before running it. */
export function confirm(title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirm') {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

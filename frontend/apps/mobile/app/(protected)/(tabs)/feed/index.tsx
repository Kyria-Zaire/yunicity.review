import { FeedScreen } from "@/components/feed/feed-screen";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedTab() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FeedScreen />
    </SafeAreaView>
  );
}

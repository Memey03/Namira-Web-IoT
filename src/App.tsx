/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MqttProvider } from './mqttContext';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <MqttProvider>
        <Dashboard />
      </MqttProvider>
    </ErrorBoundary>
  );
}

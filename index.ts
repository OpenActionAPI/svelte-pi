import { writable, get } from "svelte/store";

export const actionSettings = writable<any>({});
export const globalSettings = writable<any>({});

export const eventTarget = new EventTarget();

let ws: WebSocket, action: string, context: string;

export function sendToPlugin(payload: any) {
	if (ws?.readyState == WebSocket.OPEN) {
		ws.send(
			JSON.stringify({
				event: "sendToPlugin",
				action,
				context,
				payload,
			}),
		);
	} else {
		console.warn(
			"Failed to send sendToPlugin event: not connected to OpenAction server",
		);
	}
}

export function openUrl(url: string) {
	if (ws?.readyState == WebSocket.OPEN) {
		ws.send(
			JSON.stringify({
				event: "openUrl",
				payload: { url },
			}),
		);
	} else {
		console.warn(
			"Failed to send openUrl event: not connected to OpenAction server",
		);
	}
}

// @ts-expect-error
if (globalThis.connectOpenActionSocketData) {
	const [port, propertyInspectorUUID, registerEvent, _info, actionInfo] =
		// @ts-expect-error
		await globalThis.connectOpenActionSocketData;
	ws = new WebSocket("ws://localhost:" + port);

	const actionData = JSON.parse(actionInfo);
	action = actionData.action;
	context = actionData.context;
	actionSettings.set(actionData.payload.settings ?? {});

	let actionSettingsSubscribed = false,
		globalSettingsSubscribed = false,
		actionSettingsFromServer = false,
		globalSettingsFromServer = false;
	actionSettings.subscribe((settings) => {
		if (!actionSettingsSubscribed) {
			actionSettingsSubscribed = true;
			return;
		}
		if (actionSettingsFromServer) return;
		ws.send(
			JSON.stringify({
				event: "setSettings",
				context,
				payload: settings,
			}),
		);
	});
	globalSettings.subscribe((settings) => {
		if (!globalSettingsSubscribed) {
			globalSettingsSubscribed = true;
			return;
		}
		if (globalSettingsFromServer) return;
		ws.send(
			JSON.stringify({
				event: "setGlobalSettings",
				context,
				payload: settings,
			}),
		);
	});

	ws.onopen = () => {
		ws.send(
			JSON.stringify({
				event: registerEvent,
				uuid: propertyInspectorUUID,
			}),
		);

		ws.send(
			JSON.stringify({
				event: "getGlobalSettings",
				context,
			}),
		);
	};

	ws.onmessage = (event) => {
		const json = JSON.parse(event.data);
		if (json.event == "didReceiveSettings") {
			actionSettingsFromServer = true;
			actionSettings.set(json.payload.settings);
			actionSettingsFromServer = false;
		} else if (json.event == "didReceiveGlobalSettings") {
			globalSettingsFromServer = true;
			globalSettings.set(json.payload.settings);
			globalSettingsFromServer = false;
		}
		eventTarget.dispatchEvent(new CustomEvent(json.event, { detail: json }));
	};

	ws.onerror = (event) => {
		console.error("Encountered a WebSocket error:", event);
	};
	ws.onclose = () => {
		console.error("WebSocket connection to OpenAction server closed");
	};
} else {
	console.error(
		"Failed to connect to OpenAction server: connection details not provided",
	);
}

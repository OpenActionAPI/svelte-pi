# @openaction/svelte-pi

A Svelte library for ergonomically and concisely creating Property Inspectors for the [OpenAction API](https://openaction.amankhanna.me) (backwards-compatible with the Stream Deck SDK)

```svelte
<script lang="ts">
	import {
		actionSettings,
		globalSettings,
		eventTarget,
		sendToPlugin,
		openUrl,
	} from "@openaction/svelte-pi";

	actionSettings.subscribe((value) =>
		console.log("Action settings updated:", value),
	);
	globalSettings.subscribe((value) =>
		console.log("Global settings updated:", value),
	);

	eventTarget.addEventListener("sendToPropertyInspector", (event: any) => {
		console.log("sendToPropertyInspector event received:", event.detail);
	});

	sendToPlugin({ a: 1 });
	openUrl("https://example.com");
</script>

<p>{JSON.stringify($actionSettings)}</p>
<p>{JSON.stringify($globalSettings)}</p>

<button onclick={() => $actionSettings.value = Math.random()}>Click me</button>
```

For the OpenAction server to be able to pass connection details to your property inspector, you must include the following snippet in the `<head>` of your `app.html`:

```html
<script>
	window.connectOpenActionSocketData = new Promise((resolve) => {
		window.connectOpenActionSocket = (...args) => resolve(args);
		window.connectElgatoStreamDeckSocket = window.connectOpenActionSocket;
	});
</script>
```

See [OpenActionPlugins/discord](https://github.com/OpenActionPlugins/discord) for an example complete project setup using this library.

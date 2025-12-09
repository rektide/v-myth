import { defineConfig } from "tsdown"

export default defineConfig({
	dts: true,
	entry: ["true-myth.ts", "instance-provider.ts"],
	exports: {
		all: true,
		customExports(pkg, context) {
			console.log({ context, pkg })
			return pkg
		},
	},
	format: {
		esm: {
			target: ["es2025"],
		},
	},
	unbundle: true,
})

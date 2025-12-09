import { defineConfig } from "tsdown"

export default defineConfig({
	entry: ["true-myth.ts"],
	format: {
		esm: {
			target: ["es2025"],
		},
	},
	unbundle: true,
})

import { defineConfig } from "tsdown"

export default defineConfig({
	dts: true,
	entry: ["true-myth.ts", "instance-provider.ts"],
	exports: {
		all: true,
		customExports(pkg, context) {
			for (const exp in pkg) {
				const path = pkg[exp]
				const dts = path.replace(/.mjs$/, ".d.mjs")
				pkg[exp] = {
					types: dts,
					import: path,
				}

				if (path == "./*") continue
				const ts = exp + ".ts"
				//const ts = path.replace(/.mjs$/, ".ts");
				pkg[`${exp}.ts`] = ts
			}
			pkg["."] = {
				import: "./true-myth.ts",
			}
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

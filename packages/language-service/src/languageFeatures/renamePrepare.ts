import * as vscode from 'vscode-languageserver-protocol';
import type { LanguageServicePluginContext } from '../types';
import { languageFeatureWorker } from '../utils/featureWorkers';

export function register(context: LanguageServicePluginContext) {

	return (uri: string, position: vscode.Position) => {

		return languageFeatureWorker(
			context,
			uri,
			position,
			(position, map) => map.toGeneratedPositions(position, data => typeof data.rename === 'object' ? !!data.rename.normalize : !!data.rename),
			(plugin, document, position) => plugin.rename?.prepare?.(document, position),
			(item, map) => {
				if (!map) {
					return item;
				}
				if (vscode.Range.is(item)) {
					return map.toSourceRange(item);
				}
				return item;
			},
			prepares => {

				for (const prepare of prepares) {
					if (vscode.Range.is(prepare)) {
						return prepare; // if has any valid range, ignore other errors
					}
				}

				const error = prepares[0] as vscode.ResponseError;
				const newError = new vscode.ResponseError(error.code, error.message);

				newError.name = error.name;
				newError.stack = error.stack;

				return newError;
			},
		);
	};
}

import type { LanguageServicePluginContext } from '../types';
import { languageFeatureWorker } from '../utils/featureWorkers';
import * as vscode from 'vscode-languageserver-protocol';
import * as shared from '@volar/shared';

export function register(context: LanguageServicePluginContext) {

	return (uri: string, position: vscode.Position) => {

		return languageFeatureWorker(
			context,
			uri,
			position,
			(position, map) => map.toGeneratedPositions(position, data => !!data.completion),
			(plugin, document, position) => plugin.findLinkedEditingRanges?.(document, position),
			(data, map) => map ? ({
				wordPattern: data.wordPattern,
				ranges: data.ranges.map(range => map.toSourceRange(range)).filter(shared.notEmpty),
			}) : data,
		);
	};
}

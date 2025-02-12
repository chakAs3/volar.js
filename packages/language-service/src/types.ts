import { LanguageContext, LanguageModule, LanguageServiceHost } from '@volar/language-core';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type { DocumentContext, FileSystemProvider } from 'vscode-html-languageservice';
import type { SchemaRequestService } from 'vscode-json-languageservice';
import type * as vscode from 'vscode-languageserver-protocol';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { DocumentsAndSourceMaps } from './documents';

export * from 'vscode-languageserver-protocol';

export interface LanguageServicePluginContext {
	config: Config;
	typescript: {
		module: typeof import('typescript/lib/tsserverlibrary');
		languageServiceHost: ts.LanguageServiceHost;
		languageService: ts.LanguageService;
	} | undefined;
	env: {
		rootUri: URI;
		locale?: string;
		configurationHost?: ConfigurationHost;
		documentContext?: DocumentContext;
		fileSystemProvider?: FileSystemProvider;
		schemaRequestService?: SchemaRequestService;
	};
	uriToFileName(uri: string): string;
	fileNameToUri(fileName: string): string;

	/** @private */
	host: LanguageServiceHost;
	/** @private */
	core: LanguageContext;
	/** @private */
	documents: DocumentsAndSourceMaps;
	/** @private */
	plugins: { [id: string]: LanguageServicePluginInstance; };
	/** @private */
	getTextDocument(uri: string): TextDocument | undefined;
	/** @private */
	ruleFixes?: {
		[uri: string]: {
			[ruleId: string]: {
				[ruleFixId: number]: [vscode.Diagnostic, RuleFix[]];
			};
		};
	};
};

export interface ConfigurationHost {
	getConfiguration: (<T> (section: string, scopeUri?: string) => Promise<T | undefined>),
	onDidChangeConfiguration: (cb: () => void) => void,
}

/**
 * LanguageServicePlugin
 */

export type NotNullableResult<T> = T | Thenable<T>;
export type NullableResult<T> = NotNullableResult<T | undefined | null>;
export type SemanticToken = [number, number, number, number, number];

export interface LanguageServicePlugin<T = {}> {
	(context: LanguageServicePluginContext): LanguageServicePluginInstance & T;
}

export interface LanguageServicePluginInstance {

	rules?: {
		onAny?(context: RuleContext): NotNullableResult<RuleContext>;
		onFormat?(context: RuleContext): NotNullableResult<RuleContext>;
		onSyntax?(context: RuleContext): NotNullableResult<RuleContext>;
		onSemantic?(context: RuleContext): NotNullableResult<RuleContext>;
	};

	validation?: {
		onSemantic?(document: TextDocument): NullableResult<vscode.Diagnostic[]>;
		onSyntactic?(document: TextDocument): NullableResult<vscode.Diagnostic[]>;
		onSuggestion?(document: TextDocument): NullableResult<vscode.Diagnostic[]>;
		onDeclaration?(document: TextDocument): NullableResult<vscode.Diagnostic[]>;
	};
	doHover?(document: TextDocument, position: vscode.Position): NullableResult<vscode.Hover>,
	findImplementations?(document: TextDocument, position: vscode.Position): NullableResult<vscode.LocationLink[]>;
	findReferences?(document: TextDocument, position: vscode.Position): NullableResult<vscode.Location[]>;
	findFileReferences?(document: TextDocument): NullableResult<vscode.Location[]>;
	findDocumentHighlights?(document: TextDocument, position: vscode.Position): NullableResult<vscode.DocumentHighlight[]>;
	findDocumentLinks?(document: TextDocument): NullableResult<vscode.DocumentLink[]>;
	findDocumentSymbols?(document: TextDocument): NullableResult<vscode.SymbolInformation[]>;
	findDocumentSemanticTokens?(document: TextDocument, range: vscode.Range, legend: vscode.SemanticTokensLegend): NullableResult<SemanticToken[]>;
	findWorkspaceSymbols?(query: string): NullableResult<vscode.SymbolInformation[]>;
	findDocumentColors?(document: TextDocument): NullableResult<vscode.ColorInformation[]>;
	getColorPresentations?(document: TextDocument, color: vscode.Color, range: vscode.Range): NullableResult<vscode.ColorPresentation[]>;
	doFileRename?(oldUri: string, newUri: string): NullableResult<vscode.WorkspaceEdit>;
	getFoldingRanges?(document: TextDocument): NullableResult<vscode.FoldingRange[]>;
	getSelectionRanges?(document: TextDocument, positions: vscode.Position[]): NullableResult<vscode.SelectionRange[]>;
	getSignatureHelp?(document: TextDocument, position: vscode.Position, context?: vscode.SignatureHelpContext): NullableResult<vscode.SignatureHelp>;
	format?(document: TextDocument, range: vscode.Range, options: vscode.FormattingOptions): NullableResult<vscode.TextEdit[]>;
	formatOnType?(document: TextDocument, position: vscode.Position, key: string, options: vscode.FormattingOptions): NullableResult<vscode.TextEdit[]>;
	getIndentSensitiveLines?(document: TextDocument): NullableResult<number[]>;

	definition?: {
		on?(document: TextDocument, position: vscode.Position): NullableResult<vscode.LocationLink[]>;
		onType?(document: TextDocument, position: vscode.Position): NullableResult<vscode.LocationLink[]>;
	};

	complete?: {
		triggerCharacters?: string[],
		isAdditional?: boolean,
		on?(document: TextDocument, position: vscode.Position, context?: vscode.CompletionContext): NullableResult<vscode.CompletionList>,
		resolve?(item: vscode.CompletionItem): NotNullableResult<vscode.CompletionItem>,
	};

	rename?: {
		prepare?(document: TextDocument, position: vscode.Position): NullableResult<vscode.Range | vscode.ResponseError<void>>;
		on?(document: TextDocument, position: vscode.Position, newName: string): NullableResult<vscode.WorkspaceEdit>;
	};

	codeAction?: {
		on?(document: TextDocument, range: vscode.Range, context: vscode.CodeActionContext): NullableResult<vscode.CodeAction[]>;
		resolve?(codeAction: vscode.CodeAction): NotNullableResult<vscode.CodeAction>;
	};

	codeLens?: {
		on?(document: TextDocument): NullableResult<vscode.CodeLens[]>;
		resolve?(codeLens: vscode.CodeLens): NotNullableResult<vscode.CodeLens>;
	};

	referencesCodeLens?: {
		on?(document: TextDocument): NullableResult<vscode.Location[]>;
		resolve?(document: TextDocument, location: vscode.Location, references: vscode.Location[]): NotNullableResult<vscode.Location[]>;
	};

	callHierarchy?: {
		prepare(document: TextDocument, position: vscode.Position): NullableResult<vscode.CallHierarchyItem[]>;
		onIncomingCalls(item: vscode.CallHierarchyItem): NotNullableResult<vscode.CallHierarchyIncomingCall[]>;
		onOutgoingCalls(item: vscode.CallHierarchyItem): NotNullableResult<vscode.CallHierarchyOutgoingCall[]>;
	};

	inlayHints?: {
		on?(document: TextDocument, range: vscode.Range): NullableResult<vscode.InlayHint[]>,
		// TODO: resolve
	};

	// html
	findLinkedEditingRanges?(document: TextDocument, position: vscode.Position): NullableResult<vscode.LinkedEditingRanges>;

	doAutoInsert?(document: TextDocument, position: vscode.Position, context: {
		lastChange: {
			range: vscode.Range;
			rangeOffset: number;
			rangeLength: number;
			text: string;
		};
	}): NullableResult<string | vscode.TextEdit>;

	/**
	 * TODO: only support to doCompleteResolve for now
	 */
	resolveEmbeddedRange?(range: vscode.Range): vscode.Range | undefined;
}

export interface Rule {
	onFormat?(ctx: RuleContext): void;
	onSyntax?(ctx: RuleContext): void;
	onSemantic?(ctx: RuleContext): void;
}

export interface RuleContext {
	/**
	 * Shared modules.
	 */
	modules: {
		typescript?: typeof import('typescript/lib/tsserverlibrary');
	},
	/**
	 * IDE or user define locale.
	 * You can use it to localize your rule.
	 */
	locale?: string;
	/**
	 * Project root path.
	 */
	rootUri: URI;
	uriToFileName(uri: string): string;
	fileNameToUri(fileName: string): string;
	/**
	 * Get configuration from IDE.
	 * 
	 * For VSCode, it's .vscode/settings.json
	 */
	getConfiguration?: <T> (section: string) => Promise<T | undefined>;
	onDidChangeConfiguration?: (cb: () => void) => void;
	/**
	 * Global settings from config.
	 */
	settings: any;
	ruleId: string;
	document: TextDocument;
	report(error: vscode.Diagnostic, ...fixes: RuleFix[]): void;
}

export interface RuleFix {
	/**
	 * Code action kind, like `quickfix` or `refactor`.
	 * 
	 * See https://code.visualstudio.com/api/references/vscode-api#CodeActionKind
	 */
	kinds?: vscode.CodeActionKind[];
	/**
	 * Title of the code action.
	 */
	title?: string;
	/**
	 * Edit to apply to the document.
	 */
	getEdits?(diagnostic: vscode.Diagnostic): NullableResult<vscode.TextEdit[]>;
	/**
	 * Cross-file edits to apply to the workspace.
	 */
	getWorkspaceEdit?(diagnostic: vscode.Diagnostic): NullableResult<vscode.WorkspaceEdit>;
}

export interface Config {
	languages?: { [id: string]: LanguageModule | undefined; };
	plugins?: { [id: string]: LanguageServicePlugin | LanguageServicePluginInstance | undefined; };
	lint?: {
		rules?: { [id: string]: Rule | undefined; };
		severities?: { [id: string]: vscode.DiagnosticSeverity; };
		settings?: any;
	};
}

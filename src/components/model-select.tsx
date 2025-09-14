"use client";

import { ChevronDown, Download, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	deleteModel,
	listModels,
	putModel,
	type StoredModelRecord,
} from "@/lib/model-idb";

export interface Model {
	id: string;
	name: string;
	size: string;
	status: "available" | "downloaded" | "downloading" | "error";
	downloadProgress?: number;
	description: string;
}

interface ModelPickerProps {
	activeModel: string;
	setActiveModel: (model: string) => void;
	availableModels: Model[];
}

export function ModelPicker({
	activeModel,
	setActiveModel,
	availableModels,
}: ModelPickerProps) {
	const [models, setModels] = useState<Model[]>(availableModels);

	useEffect(() => {
		const loadDownloadedModels = async () => {
			try {
				const downloadedModelIds = await listModels();
				setModels((prev) =>
					prev.map((model) => ({
						...model,
						status: downloadedModelIds.includes(model.id)
							? "downloaded"
							: "available",
					})),
				);

				if (!activeModel && downloadedModelIds.length > 0) {
					setActiveModel(downloadedModelIds[0]);
				}
			} catch (error) {
				console.error("Failed to load downloaded models:", error);
			}
		};

		loadDownloadedModels();
	}, [activeModel, setActiveModel]);

	const handleDownload = async (modelId: string) => {
		const model = models.find((m) => m.id === modelId);
		if (!model) return;

		setModels((prev) =>
			prev.map((m) =>
				m.id === modelId
					? { ...m, status: "downloading", downloadProgress: 0 }
					: m,
			),
		);

		try {
			const response = await fetch(
				"https://gist.githubusercontent.com/MattIPv4/045239bc27b16b2bcf7a3a9a4648c08a/raw/2411e31293a35f3e565f61e7490a806d4720ea7e/bee%2520movie%2520script",
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const contentLength = response.headers.get("content-length");
			const total = contentLength ? Number.parseInt(contentLength, 10) : 0;

			if (!response.body) {
				throw new Error("Response body is null");
			}

			const reader = response.body.getReader();
			const chunks: Uint8Array[] = [];
			let receivedLength = 0;

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				if (value) {
					chunks.push(value);
					receivedLength += value.length;

					const progress = total > 0 ? (receivedLength / total) * 100 : 0;
					setModels((prev) =>
						prev.map((m) =>
							m.id === modelId ? { ...m, downloadProgress: progress } : m,
						),
					);
				}
			}

			const allChunks = new Uint8Array(receivedLength);
			let position = 0;
			for (const chunk of chunks) {
				allChunks.set(chunk, position);
				position += chunk.length;
			}

			const blob = new Blob([allChunks], { type: "text/plain" });

			const record: StoredModelRecord = {
				value: modelId,
				label: model.name,
				blob,
				size: blob.size,
				createdAt: Date.now(),
			};

			await putModel(record);

			setModels((prev) =>
				prev.map((m) =>
					m.id === modelId
						? { ...m, status: "downloaded", downloadProgress: 100 }
						: m,
				),
			);

			if (!activeModel) {
				setActiveModel(modelId);
			}
		} catch (error) {
			console.error("Download failed:", error);
			setModels((prev) =>
				prev.map((m) =>
					m.id === modelId
						? { ...m, status: "error", downloadProgress: undefined }
						: m,
				),
			);
		}
	};

	const handleDelete = async (modelId: string) => {
		try {
			await deleteModel(modelId);
			setModels((prev) =>
				prev.map((model) =>
					model.id === modelId
						? { ...model, status: "available", downloadProgress: undefined }
						: model,
				),
			);

			if (activeModel === modelId) {
				const remainingDownloaded = models.filter(
					(m) => m.status === "downloaded" && m.id !== modelId,
				);
				setActiveModel(
					remainingDownloaded.length > 0 ? remainingDownloaded[0].id : "",
				);
			}
		} catch (error) {
			console.error("Failed to delete model:", error);
		}
	};

	const handleRetry = (modelId: string) => {
		handleDownload(modelId);
	};

	const activeModelData = models.find((m) => m.id === activeModel);

	return (
		<div className="w-full max-w-md">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-between h-12 px-4 bg-transparent"
					>
						<div className="flex items-center gap-3">
							<div className="text-left">
								<div className="font-medium">
									{activeModelData?.name || "Select Model"}
								</div>
								{activeModelData && (
									<div className="text-xs text-muted-foreground">
										{activeModelData.size}
									</div>
								)}
							</div>
						</div>
						<ChevronDown className="h-4 w-4 opacity-50" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent className="w-80 p-2">
					<div className="space-y-1">
						{models.map((model) => (
							<div
								key={model.id}
								className="p-3 rounded-lg border border-transparent hover:border-border transition-colors"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3 flex-1">
										<div className="flex items-center mt-0.5">
											{model.status === "downloaded" && (
												<button
													type="button"
													onClick={() => setActiveModel(model.id)}
													className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
												>
													{model.id === activeModel && (
														<div className="h-2 w-2 rounded-full bg-primary" />
													)}
												</button>
											)}
											{model.status !== "downloaded" && (
												<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
											)}
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-medium truncate">
													{model.name}
												</span>
											</div>
											<div className="text-xs text-muted-foreground">
												{model.description}
											</div>
											<div className="flex items-center gap-2 mt-1">
												<span className="text-xs text-muted-foreground">
													{model.size}
												</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-1 ml-2">
										{model.status === "downloaded" && (
											<Button
												size="sm"
												variant="ghost"
												className="h-8 w-8 p-0 text-destructive hover:text-destructive"
												onClick={() => handleDelete(model.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}

										{model.status === "available" && (
											<Button
												size="sm"
												variant="ghost"
												className="h-8 w-8 p-0"
												onClick={() => handleDownload(model.id)}
											>
												<Download className="h-4 w-4" />
											</Button>
										)}

										{model.status === "downloading" && (
											<div className="h-8 w-8 flex items-center justify-center">
												<Loader2 className="h-4 w-4 animate-spin" />
											</div>
										)}

										{model.status === "error" && (
											<Button
												size="sm"
												variant="ghost"
												className="h-8 w-8 p-0"
												onClick={() => handleRetry(model.id)}
											>
												<Download className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>

								{model.status === "downloading" &&
									model.downloadProgress !== undefined && (
										<div className="space-y-1 mt-3">
											<div className="flex justify-between text-xs">
												<span className="text-muted-foreground"></span>
												<span className="text-muted-foreground">
													{Math.round(model.downloadProgress)}%
												</span>
											</div>
											<Progress
												value={model.downloadProgress}
												className="h-2"
											/>
										</div>
									)}
							</div>
						))}
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

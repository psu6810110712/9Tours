import React, { useRef } from 'react';

interface ImageUploadSectionProps {
    images: string[];
    uploadingImage: boolean;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    onRemoveImage: (index: number) => void;
}

export default function ImageUploadSection({
    images,
    uploadingImage,
    onImageUpload,
    onRemoveImage
}: ImageUploadSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                รูปภาพประกอบ
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {images.map((img, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                        <img src={img} alt={`Tour ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <button
                            onClick={() => onRemoveImage(index)}
                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                            type="button"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}

                {images.length < 5 && (
                    <div
                        className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-colors group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploadingImage ? (
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-primary rounded-full animate-spin mb-2"></div>
                                <span className="text-sm text-gray-500">กำลังอัปโหลด...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-primary transition-colors p-4 text-center">
                                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-sm font-medium">เพิ่มรูปภาพ</span>
                                <span className="text-xs mt-1">สูงสุด 5 รูป (JPG, PNG)</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png"
                            onChange={onImageUpload}
                            disabled={uploadingImage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

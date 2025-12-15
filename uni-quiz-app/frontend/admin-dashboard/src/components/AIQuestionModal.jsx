import React, { useState } from 'react'
import { questionsApi } from '../services/api'
import { X, Upload, FileText, Image as ImageIcon, Sparkles, Loader } from 'lucide-react'

const AIQuestionModal = ({ isOpen, onClose, onQuestionsGenerated, showToast }) => {
    const [activeTab, setActiveTab] = useState('text')
    const [textInput, setTextInput] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [questionCount, setQuestionCount] = useState(5)

    if (!isOpen) return null

    const handleTextSubmit = async () => {
        if (!textInput.trim()) {
            showToast('Please enter some text', 'error')
            return
        }

        setIsLoading(true)
        try {
            const response = await questionsApi.generateFromText(textInput, questionCount)
            onQuestionsGenerated(response.data)
            onClose()
            showToast('Questions generated successfully!', 'success')
        } catch (error) {
            console.error(error)
            showToast('Failed to generate questions. Please try again.', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageSubmit = async () => {
        if (!selectedImage) {
            showToast('Please select an image', 'error')
            return
        }

        setIsLoading(true)
        try {
            const response = await questionsApi.generateFromImage(selectedImage)
            onQuestionsGenerated(response.data)
            onClose()
            showToast('Questions generated successfully!', 'success')
        } catch (error) {
            console.error(error)
            showToast('Failed to generate questions', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0])
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        <h2 className="text-xl font-bold">AI Helper</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition ${activeTab === 'text'
                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('text')}
                    >
                        <FileText className="w-5 h-5" />
                        From Text
                    </button>
                    <button
                        className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition ${activeTab === 'image'
                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('image')}
                    >
                        <ImageIcon className="w-5 h-5" />
                        From Image
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'text' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Paste your content here
                                </label>
                                <textarea
                                    className="w-full h-48 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Paste lecture notes, book chapters, or any text here..."
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of questions
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors bg-gray-50">
                                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-400">JPG, PNG, WEBP up to 5MB</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                />
                            </div>
                            {selectedImage && (
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg text-indigo-700 border border-indigo-100">
                                    <ImageIcon className="w-5 h-5" />
                                    <span className="truncate flex-1 font-medium">{selectedImage.name}</span>
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="text-indigo-400 hover:text-indigo-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={activeTab === 'text' ? handleTextSubmit : handleImageSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AIQuestionModal

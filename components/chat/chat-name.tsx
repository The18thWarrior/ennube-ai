

export default ({ isEditingName, _name, setName, handleNameSave, setIsEditingName }: { isEditingName: boolean; _name: string; setName: (name: string) => void; handleNameSave: () => void; setIsEditingName: (isEditing: boolean) => void; }) => (
    <div className="flex items-start">
        <div className="min-w-0 wcontent">
            <span className="text-xs text-muted-foreground">Name</span>
            <div className="text-sm font-medium break-words">
                {isEditingName ? (
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleNameSave();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={_name}
                            className="border border-slate-200 rounded px-2 py-1 text-sm w-40 bg-transparent"
                            onChange={(e) => setName(e.target.value)}
                        />
                        <button type="submit" className="text-xs px-2 py-1 rounded bg-purple-500 text-white hover:bg-purple-600">Save</button>
                        <button
                            type="button"
                            className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                            onClick={() => setIsEditingName(false)}
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <span className={'text-xl'}>{_name || <span className="italic text-muted-foreground">(no name)</span>}</span>
                )}
            </div>
        </div>
        {!isEditingName && (
            <>
            <button
                type="button"
                className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-purple-500"
                onClick={() => setIsEditingName(true)}
                aria-label="Edit Name"
            >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
            </button>
            </>
        )}
    </div>
)
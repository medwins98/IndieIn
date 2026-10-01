/* Preact Core */ import { html, useEffect, useState, useCallback, useMemo } from 'importmap';
/* UI & Form */ import { FormFieldSelect, BtnIcon } from 'importmap';
/* I18n */ import { useI18n } from 'importmap';

const generatePatch = () => ({
	id: Date.now() + Math.random(),
	field: '',
	value: ''
});

export function BulkUpdateSection({ selection, columns, onFormSubmit })
{
	const [patches, setPatches] = useState([generatePatch()]);
	
	const handleSubmit = (e) => {
		e.preventDefault();
		const formData = Object.fromEntries(
			patches
				.filter(p => p.field)
				.map(p => [p.field, p.value])
		);
		onFormSubmit(formData);
	};

	return html`
		<form class="flex-column gap075" onSubmit=${handleSubmit}>
			<${BulkUpdateManager} patches=${patches} setPatches=${setPatches} options=${columns} />
			<button type="submit" class="btn btn-primary-brand w-full">
				Update ${selection.ids.size} records
			</button>
		</form>
	`;
}

function BulkUpdateManager({ patches, setPatches, options })
{
	const { t } = useI18n();

	const addField = () => setPatches([ ...patches, generatePatch()]);
	const removeField = (id) => {
		if(patches.length === 1) return;
		setPatches(patches.filter(p => p.id !== id));
	};
	const updateField = (id, key, val) => {
		setPatches(patches.map(p => p.id === id ? { ...p, [key]: val } : p));
	};

	return html`
		${patches.map((p) => html`
			<fieldset key=${p.id}>
				<div class="input-group joined">
					<${FormFieldSelect}
						options=${options}
						value=${p.field}
						onChange=${e => updateField(p.id, 'field', e.target.value)} >
						
						<option value="" disabled=${true}>${t('data.select_column_placeholder') || 'Select field'}</option>
					<//>

					<input
						type="text"
						placeholder="New value"
						value=${p.value}
						onInput=${e => updateField(p.id, 'value', e.target.value)}
					/>
					${patches.length > 1 && html`<${BtnIcon} icon="delete" className="danger" onClick=${() => removeField(p.id)} />`}
				</div>
			</fieldset>
		`)}
		<button type="button" class="btn btn-secondary-brand" onClick=${addField}>
			+ Add field
		</button>
	`;
}
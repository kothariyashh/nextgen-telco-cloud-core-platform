{{- define "ngcmcp-nf.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ngcmcp-nf.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "ngcmcp-nf.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Filter, Calendar, Search } from 'lucide-react';

const RoadmapGenerator = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    area: '',
    type: '',
    phase: '',
    divisions: []
  });

  // Configuration
  const areas = [
    'Business Solutions', 'Customer Facing', 'Manufacturing', 'Source to Pay', 'Supply Chain Execution',
    'Supply Chain Planning', 'Finance Controlling and Reporting', 'Core Finance',
    'Sustainability', 'HR', 'ERP', 'Security', 'Governance', 'Workplace',
    'IT/OT', 'Data & Automation'
  ];

 const phases = [
  { name: 'Ideation', color: '#EF4444' },        // Red (unchanged)
  { name: 'Opportunity', color: '#F59E0B' },     // Amber/Orange (unchanged) 
  { name: 'Feasibility', color: '#10B981' },     // Green (unchanged)
  { name: 'Design', color: '#6B7280' },          // Gray (unchanged)
  { name: 'Realisation', color: '#8B5CF6' },     // Purple (changed from amber)
  { name: 'Deploy', color: '#3B82F6' },          // Blue (unchanged)
  { name: 'Hypercare & Closing', color: '#EC4899' } // Pink (changed from purple)
];

  const types = ['Central initiative', 'Local Initiative'];
  const divisions = ['Group', 'EBP', 'Industry', 'Insulation', 'Fibre Cement'];

  // Parse DD/MM/YYYY dates
  const parseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const match = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2020 || year > 2030) return null;
    
    return new Date(year, month, day);
  };

  // Parse CSV - reads from multiple division columns (H, I, J, K, L)
  const parseCSV = (csvText) => {
  console.log('CSV parsing started');
  const lines = csvText.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim());
  console.log('Total lines after filtering:', lines.length);
  console.log('First few lines:', lines.slice(0, 3));
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    console.log(`Line ${index + 1} values:`, values);
    
    // Parse divisions from multiple columns (indices 7, 8, 9, 10, 11)
    const divisions = [];
    for (let i = 7; i <= 11; i++) {
      if (values[i] && values[i].length > 0) {
        divisions.push(values[i]);
      }
    }
    
    const project = {
      id: index,
      trackerId: values[0] || '',
      area: values[1] || '',
      projectName: values[2] || '',
      phase: values[3] || '',
      type: values[4] || '',
      startDate: parseDate(values[5]),
      endDate: parseDate(values[6]),
      divisions: divisions,
      division: divisions[0] || ''
    };
    
    console.log(`Project ${index + 1}:`, project);
    return project;
  }).filter(project => {
    const hasProjectName = project.projectName;
    console.log(`Project "${project.projectName}" has name:`, hasProjectName);
    return hasProjectName;
  });
};

  // Apply filters with search
  const applyFilters = useCallback(() => {
    let filtered = projects;
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.trackerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.divisions.some(div => div.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply dropdown filters
    if (filters.area) filtered = filtered.filter(p => p.area === filters.area);
    if (filters.type) filtered = filtered.filter(p => p.type === filters.type);
    if (filters.phase) filtered = filtered.filter(p => p.phase === filters.phase);
    
    // Apply division filter - show projects with ANY of selected divisions
    if (filters.divisions.length > 0) {
      filtered = filtered.filter(p => 
        filters.divisions.some(selectedDiv => p.divisions.includes(selectedDiv))
      );
    }
    
    setFilteredProjects(filtered);
  }, [projects, searchTerm, filters]);

  // Auto-apply filters when search term or filters change
  useEffect(() => {
    if (projects.length > 0) {
      applyFilters();
    }
  }, [searchTerm, filters, projects, applyFilters]);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
  console.log('File upload triggered'); // Add this line
  const file = event.target.files[0];
  console.log('Selected file:', file); // Add this line
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    console.log('File read successfully'); // Add this line
    console.log('File content length:', e.target.result.length); // Add this line
    try {
      const parsedProjects = parseCSV(e.target.result);
      console.log('Parsed projects:', parsedProjects); // Add this line
      setProjects(parsedProjects);
      setFilteredProjects(parsedProjects);
    } catch (error) {
      console.error('Parsing error:', error); // Add this line
      alert('Error parsing CSV file. Please check the format.');
    }
  };
  reader.readAsText(file);
}, []);;

  // Reset filters and search
  const resetFilters = () => {
    setFilters({ area: '', type: '', phase: '', divisions: [] });
    setSearchTerm('');
    setFilteredProjects(projects);
  };

  // Handle division checkbox changes
  const handleDivisionChange = (division) => {
    setFilters(prev => ({
      ...prev,
      divisions: prev.divisions.includes(division)
        ? prev.divisions.filter(d => d !== division)
        : [...prev.divisions, division]
    }));
  };

  // Get phase color
  const getPhaseColor = (phaseName) => {
    const phase = phases.find(p => p.name === phaseName);
    return phase ? phase.color : '#6B7280';
  };

  // Calculate timeline position (2025-2026 only)
  const getTimelinePosition = (project) => {
    if (!project.startDate || !project.endDate) return null;

    const timelineStart = new Date(2025, 0, 1); // Jan 1, 2025
    const timelineEnd = new Date(2026, 11, 31); // Dec 31, 2026
    
    if (project.endDate < timelineStart || project.startDate > timelineEnd) return null;
    
    const totalMs = timelineEnd.getTime() - timelineStart.getTime();
    const startMs = Math.max(project.startDate.getTime(), timelineStart.getTime());
    const endMs = Math.min(project.endDate.getTime(), timelineEnd.getTime());
    
    const startOffset = startMs - timelineStart.getTime();
    const duration = endMs - startMs;
    
    return {
      left: (startOffset / totalMs) * 100,
      width: Math.max(2, (duration / totalMs) * 100),
      color: getPhaseColor(project.phase)
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Roadmap Generator</h1>
          <p className="text-gray-600">Import your CSV file to generate an interactive project roadmap</p>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <Upload className="h-5 w-5 text-blue-600" />
            <div>
              <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          {projects.length > 0 && (
            <div className="mt-4 text-sm text-green-600">
              ✓ {projects.length} projects loaded successfully
            </div>
          )}
        </div>

        {/* Search & Filters */}
        {projects.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Search & Filters</h2>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects by name, ID, area, or division..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                <select
                  value={filters.area}
                  onChange={(e) => setFilters({...filters, area: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Areas</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
                <select
                  value={filters.phase}
                  onChange={(e) => setFilters({...filters, phase: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Phases</option>
                  {phases.map(phase => (
                    <option key={phase.name} value={phase.name}>{phase.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Division Multi-Select Checkboxes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Divisions ({filters.divisions.length > 0 ? `${filters.divisions.length} selected` : 'All'})
              </label>
              <div className="flex flex-wrap gap-3">
                {divisions.map(division => (
                  <label key={division} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.divisions.includes(division)}
                      onChange={() => handleDivisionChange(division)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 select-none">{division}</span>
                  </label>
                ))}
              </div>
              {filters.divisions.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  Showing projects with ANY of: {filters.divisions.join(', ')}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Reset All
                </button>
                <span className="text-sm text-gray-500 flex items-center">
                  Filters applied automatically
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Phase Legend */}
        {projects.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Legend</h3>
            <div className="flex flex-wrap gap-4">
              {phases.map(phase => (
                <div key={phase.name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: phase.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{phase.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roadmap Section */}
        {filteredProjects.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header with Toggle Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Project Roadmap ({filteredProjects.length} projects)
                </h2>
              </div>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                style={{ minWidth: '150px' }}
              >
                {isExpanded ? "⬇ Collapse Details" : "➡ Expand Details"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Timeline Header */}
                <div className="flex border-b border-gray-200 pb-2 mb-4">
                  <div className="w-72 pr-4 text-sm font-medium text-gray-700">Project Information</div>
                  <div className="flex-1 flex">
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded mx-0.5">Q1 25</div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded mx-0.5">Q2 25</div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-red-100 border border-red-300 rounded mx-0.5 relative">
                      Q3 25
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium">
                        Today
                      </div>
                    </div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded mx-0.5">Q4 25</div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded mx-0.5">Q1 26</div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded mx-0.5">Q2 26</div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded mx-0.5">Q3 26</div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded mx-0.5">Q4 26</div>
                  </div>
                </div>

                {/* Project Rows */}
                <div className={isExpanded ? "space-y-2" : "space-y-1"}>
                  {filteredProjects.map((project) => {
                    const timelinePos = getTimelinePosition(project);
                    return (
                      <div key={project.id} className={`flex items-center border-b border-gray-100 ${isExpanded ? 'pb-2' : 'pb-1'}`}>
                        <div className="w-72 pr-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900 truncate" title={project.projectName}>
                              {project.projectName}
                            </div>
                            {!isExpanded && project.divisions.length > 1 && (
                              <span className="inline-block px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                {project.divisions.length}
                              </span>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div>ID: {project.trackerId}</div>
                              <div>Area: {project.area}</div>
                              <div>Type: {project.type}</div>
                              {project.divisions.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span>Divisions:</span>
                                  {project.divisions.map((division, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                                    >
                                      {division}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div>
                                {project.startDate ? project.startDate.toLocaleDateString('en-GB') : 'No start'} - 
                                {project.endDate ? project.endDate.toLocaleDateString('en-GB') : 'No end'}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 relative h-8 bg-gray-50 rounded">
                          {timelinePos ? (
                            <div
                              className="absolute top-0.5 bottom-0.5 rounded text-white text-xs flex items-center px-2 font-medium"
                              style={{
                                left: `${timelinePos.left}%`,
                                width: `${timelinePos.width}%`,
                                backgroundColor: timelinePos.color
                              }}
                              title={`${project.projectName} (${project.phase})${!isExpanded ? `\nID: ${project.trackerId}\nArea: ${project.area}\nType: ${project.type}${project.divisions.length > 0 ? `\nDivisions: ${project.divisions.join(', ')}` : ''}` : ''}`}
                            >
                              <span className="truncate">{project.phase}</span>
                            </div>
                          ) : (
                            <div className="absolute top-0.5 bottom-0.5 left-2 text-xs text-gray-500 flex items-center">
                              No valid dates
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{filteredProjects.length}</div>
                  <div className="text-sm text-gray-600">
                    {searchTerm || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f) ? 'Filtered' : 'Total'} Projects
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(filteredProjects.map(p => p.area)).size}
                  </div>
                  <div className="text-sm text-gray-600">Areas Covered</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(filteredProjects.flatMap(p => p.divisions)).size}
                  </div>
                  <div className="text-sm text-gray-600">Divisions Covered</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredProjects.filter(p => ['Design', 'Realisation', 'Deploy'].includes(p.phase)).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Projects</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Loaded</h3>
            <p className="text-gray-600 mb-4">Upload a CSV file to generate your project roadmap</p>
            <p className="text-sm text-gray-500">
              Expected format: Tracker ID; Area; Project name; Phase; Type; Start date; End Date; Division 1; Division 2; Division 3; Division 4; Division 5
            </p>
            <p className="text-xs text-gray-400 mt-2">
              💡 Tip: Use separate columns (H, I, J, K, L) for each division. Leave empty if not applicable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapGenerator;